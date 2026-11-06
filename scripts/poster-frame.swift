// Saves one frame of a video as a JPEG (used by encode-videos.mjs).
import AVFoundation
import AppKit
// usage: frame.swift <in> <out.jpg> <seconds> [maxWidth]
let a = CommandLine.arguments
let gen = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: a[1])))
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
if a.count > 4, let w = Double(a[4]) { gen.maximumSize = CGSize(width: w, height: w) }
let sem = DispatchSemaphore(value: 0)
gen.generateCGImageAsynchronously(for: CMTime(seconds: Double(a[3])!, preferredTimescale: 600)) { img, _, err in
  if let img = img {
    let rep = NSBitmapImageRep(cgImage: img)
    try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.82])!.write(to: URL(fileURLWithPath: a[2]))
  } else { print("ERR", err as Any) }
  sem.signal()
}
sem.wait()
