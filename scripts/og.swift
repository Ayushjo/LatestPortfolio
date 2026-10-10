// Renders public/og-v2.png (bump the name when it changes) (1200×630): "AYUSH" as silver particles with a soft glow, plus name and URL.
// Run: swift scripts/og.swift
import AppKit
import CoreImage

let W = 1200, H = 630
let out = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "public/og-v2.png")

func bitmap() -> CGContext {
  CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}

// 1. Rasterise the word to find where particles may land.
let mask = bitmap()
NSGraphicsContext.current = NSGraphicsContext(cgContext: mask, flipped: false)
let word = NSAttributedString(string: "AYUSH", attributes: [
  .font: NSFont.systemFont(ofSize: 250, weight: .black),
  .foregroundColor: NSColor.white,
  .kern: -10,
])
let size = word.size()
word.draw(at: NSPoint(x: (CGFloat(W) - size.width) / 2, y: 250))
let maskData = mask.data!.assumingMemoryBound(to: UInt8.self)
let stride = mask.bytesPerRow
var ink: [(Int, Int)] = []
// Bitmap rows run top-down; CoreGraphics y runs bottom-up.
for y in 0..<H { for x in 0..<W where maskData[y * stride + x * 4 + 3] > 128 { ink.append((x, H - 1 - y)) } }

// 2. Scatter silver particles over the ink, plus a sparse stream across the frame.
let dots = bitmap()
var rng = SystemRandomNumberGenerator()
for _ in 0..<70_000 {
  let (x, y) = ink[Int.random(in: 0..<ink.count, using: &rng)]
  let a = CGFloat.random(in: 0.35...0.95, using: &rng)
  let r = CGFloat.random(in: 0.5...1.25, using: &rng)
  dots.setFillColor(red: 0.93 * a, green: 0.95 * a, blue: a, alpha: a)
  dots.fillEllipse(in: CGRect(x: CGFloat(x) + .random(in: 0...1), y: CGFloat(y) + .random(in: 0...1), width: r * 2, height: r * 2))
}
for i in 0..<5_000 {
  let lane = CGFloat(i % 36) / 36
  let x = CGFloat.random(in: 0...CGFloat(W), using: &rng)
  let y = 315 + (lane - 0.5) * 360 + sin(x * 0.006 + lane * 9) * 26 + .random(in: -3...3, using: &rng)
  let a = CGFloat.random(in: 0.05...0.28, using: &rng)
  dots.setFillColor(red: 0.9 * a, green: 0.92 * a, blue: a, alpha: a)
  dots.fill(CGRect(x: x, y: y, width: .random(in: 2...9, using: &rng), height: 0.9))
}
let dotsImage = CIImage(cgImage: dots.makeImage()!)

// 3. Glow: a blurred copy screened over the sharp particles, on near-black.
let glow = dotsImage.applyingGaussianBlur(sigma: 9).cropped(to: dotsImage.extent)
let background = CIImage(color: CIColor(red: 0.02, green: 0.02, blue: 0.024)).cropped(to: dotsImage.extent)
let composed = dotsImage
  .applyingFilter("CIScreenBlendMode", parameters: [kCIInputBackgroundImageKey: glow.applyingFilter("CIColorControls", parameters: [kCIInputBrightnessKey: 0, kCIInputContrastKey: 1.1])])
  .composited(over: background)
let ci = CIContext()
let final = bitmap()
final.draw(ci.createCGImage(composed, from: dotsImage.extent)!, in: CGRect(x: 0, y: 0, width: W, height: H))

// 4. Typography.
NSGraphicsContext.current = NSGraphicsContext(cgContext: final, flipped: false)
let serif = NSFont(name: "Georgia-Italic", size: 46) ?? NSFont.systemFont(ofSize: 46)
NSAttributedString(string: "Ayush Singh", attributes: [.font: serif, .foregroundColor: NSColor(white: 0.95, alpha: 1)])
  .draw(at: NSPoint(x: 64, y: 92))
let mono = NSFont.monospacedSystemFont(ofSize: 18, weight: .regular)
NSAttributedString(string: "SYSTEMS ENGINEER  ·  RUST / TYPESCRIPT / PYTHON", attributes: [.font: mono, .foregroundColor: NSColor(white: 0.6, alpha: 1), .kern: 1.5])
  .draw(at: NSPoint(x: 66, y: 56))
NSAttributedString(string: "iayush.com", attributes: [.font: mono, .foregroundColor: NSColor(white: 0.85, alpha: 1)])
  .draw(at: NSPoint(x: CGFloat(W) - 64 - 110, y: 56))

let rep = NSBitmapImageRep(cgImage: final.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: out)
print("wrote \(out.path)")
