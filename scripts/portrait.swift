// Turns a photo into the portrait assets the site uses:
//   public/portrait/ayush-matte.png      768² luminance of the person on black (particle shape source)
//   public/portrait/ayush-halftone.png   512² silver halftone, circle-cropped (avatar)
//   public/portrait/ayush-avatar.png     256² smooth silver-toned avatar
//   public/favicon-64.png, public/apple-touch-icon.png
// The background is removed on-device with Vision person segmentation, so the wall never becomes particles.
// Run: swift scripts/portrait.swift <photo.jpg> <cropX> <cropY> <cropSize>   (crop in image pixels, top-left origin)
import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins
import Vision

let args = CommandLine.arguments
guard args.count == 5, let cx = Double(args[2]), let cy = Double(args[3]), let cs = Double(args[4]) else {
  print("usage: swift scripts/portrait.swift <photo> <cropX> <cropY> <cropSize>")
  exit(1)
}
let photo = CIImage(contentsOf: URL(fileURLWithPath: args[1]), options: [.applyOrientationProperty: true])!
let ci = CIContext()

// 1. Person matte at full resolution.
let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
try VNImageRequestHandler(ciImage: photo).perform([request])
let maskBuffer = request.results!.first!.pixelBuffer
var mask = CIImage(cvPixelBuffer: maskBuffer)
mask = mask.transformed(by: CGAffineTransform(scaleX: photo.extent.width / mask.extent.width, y: photo.extent.height / mask.extent.height))

// 2. Grey, contrast-shaped subject on black; crop to head and shoulders.
let grey = photo.applyingFilter("CIColorControls", parameters: [kCIInputSaturationKey: 0, kCIInputContrastKey: 1.25, kCIInputBrightnessKey: 0.02])
let black = CIImage(color: .black).cropped(to: photo.extent)
let cropRect = CGRect(x: cx, y: photo.extent.height - cy - cs, width: cs, height: cs)
// Soft oval vignette centred a little above the crop's middle, so shoulders dissolve instead of ending in a hard edge.
let vignette = CIFilter.radialGradient()
vignette.center = CGPoint(x: cropRect.midX, y: cropRect.minY + cs * 0.56)
vignette.radius0 = Float(cs * 0.27)
vignette.radius1 = Float(cs * 0.5)
vignette.color0 = .white
vignette.color1 = .black
let fadedMask = mask.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: vignette.outputImage!.cropped(to: photo.extent)])
let subject = grey.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: black, kCIInputMaskImageKey: fadedMask])

func write(_ image: CIImage, size: Int, to path: String) {
  let scaled = image.cropped(to: cropRect)
    .transformed(by: CGAffineTransform(translationX: -cropRect.minX, y: -cropRect.minY))
    .transformed(by: CGAffineTransform(scaleX: CGFloat(size) / cs, y: CGFloat(size) / cs))
  let cg = ci.createCGImage(scaled, from: CGRect(x: 0, y: 0, width: size, height: size))!
  try! NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}

try? FileManager.default.createDirectory(atPath: "public/portrait", withIntermediateDirectories: true)
write(subject, size: 768, to: "public/portrait/ayush-matte.png")

// 3. Silver halftone avatar: dot area follows luminance, on the site's near-black, circle-cropped.
func halftone(size: Int, cell: CGFloat) -> CGImage {
  let src = ci.createCGImage(
    subject.cropped(to: cropRect)
      .transformed(by: CGAffineTransform(translationX: -cropRect.minX, y: -cropRect.minY))
      .transformed(by: CGAffineTransform(scaleX: CGFloat(size) / cs, y: CGFloat(size) / cs)),
    from: CGRect(x: 0, y: 0, width: size, height: size))!
  let rep = NSBitmapImageRep(cgImage: src)
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.addEllipse(in: CGRect(x: 0, y: 0, width: size, height: size))
  ctx.clip()
  ctx.setFillColor(red: 0.02, green: 0.02, blue: 0.024, alpha: 1)
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
  ctx.setFillColor(red: 0.9, green: 0.92, blue: 0.96, alpha: 1)
  var y: CGFloat = cell / 2
  var row = 0
  while y < CGFloat(size) {
    var x: CGFloat = cell / 2 + (row % 2 == 0 ? 0 : cell / 2)
    while x < CGFloat(size) {
      let lum = rep.colorAt(x: Int(x), y: size - 1 - Int(y))?.brightnessComponent ?? 0
      let t = 0.9 * pow(max(0, min(1, (lum - 0.03) / 0.95)), 1.05)
      let r = cell * 0.6 * sqrt(t)
      if r > 0.25 { ctx.fillEllipse(in: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)) }
      x += cell
    }
    y += cell * 0.866
    row += 1
  }
  return ctx.makeImage()!
}

func save(_ cg: CGImage, _ path: String) {
  try! NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}
save(halftone(size: 512, cell: 4.6), "public/portrait/ayush-halftone.png")

/// Small icons: halftone turns to mush at tab size, so use the smooth silver-toned matte in a circle.
func icon(size: Int) -> CGImage {
  let tinted = subject.applyingFilter("CIColorMatrix", parameters: [
    "inputRVector": CIVector(x: 0.92, y: 0, z: 0, w: 0), "inputGVector": CIVector(x: 0, y: 0.94, z: 0, w: 0),
    "inputBVector": CIVector(x: 0, y: 0, z: 1, w: 0), "inputBiasVector": CIVector(x: 0.012, y: 0.012, z: 0.016, w: 0),
  ])
  let src = ci.createCGImage(
    tinted.cropped(to: cropRect)
      .transformed(by: CGAffineTransform(translationX: -cropRect.minX, y: -cropRect.minY))
      .transformed(by: CGAffineTransform(scaleX: CGFloat(size) / cs, y: CGFloat(size) / cs)),
    from: CGRect(x: 0, y: 0, width: size, height: size))!
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .high
  ctx.addEllipse(in: CGRect(x: 0, y: 0, width: size, height: size))
  ctx.clip()
  ctx.draw(src, in: CGRect(x: 0, y: 0, width: size, height: size))
  return ctx.makeImage()!
}
save(icon(size: 180), "public/apple-touch-icon.png")
save(icon(size: 64), "public/favicon-64.png")
save(icon(size: 256), "public/portrait/ayush-avatar.png")
print("portrait assets written")
