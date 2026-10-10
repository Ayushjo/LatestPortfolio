// Turns a logo or picture into a particle-shape source: grey on black, where brighter means
// denser particles (see imageCanvas in src/gl/shapes/index.ts).
//
// Run: swift scripts/logo-matte.swift <in> <out.png> <maxSide> [options]
//   --floor F     any visible pixel is lifted to at least F, so dark brand colours still read
//   --outline R   adds a bright R-px outline around the subject: the logo's alpha (an app-icon
//                 tile, say) or, with --person, the person
//   --person L    keeps only the person (Vision segmentation) and lifts their darks by L, so
//                 black clothing still shows as a faint silhouette instead of vanishing; contrast
//                 is raised and saturated colour counts as extra bright, so a coloured focal
//                 point (an orange, say) stands out of a grey picture
import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins
import Vision

var args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 3, let maxSide = Double(args[2]) else {
  print("usage: swift scripts/logo-matte.swift <in> <out.png> <maxSide> [--floor F] [--outline R] [--person L]")
  exit(1)
}
func option(_ name: String) -> Double? {
  guard let i = args.firstIndex(of: name), i + 1 < args.count else { return nil }
  return Double(args[i + 1])
}
let floorLevel = option("--floor")
let outline = option("--outline")
let personLift = option("--person")

let input = CIImage(contentsOf: URL(fileURLWithPath: args[0]), options: [.applyOrientationProperty: true])!
let extent = input.extent
let black = CIImage(color: .black).cropped(to: extent)
let ci = CIContext()

/// A colour cube that maps every colour to one grey level: f(luminance, saturation).
func greyCube(_ f: (Double, Double) -> Double) -> CIFilter {
  let n = 64
  var data = [Float](repeating: 0, count: n * n * n * 4)
  for b in 0..<n { for g in 0..<n { for r in 0..<n {
    let (rf, gf, bf) = (Double(r) / Double(n - 1), Double(g) / Double(n - 1), Double(b) / Double(n - 1))
    let lum = 0.2126 * rf + 0.7152 * gf + 0.0722 * bf
    let sat = max(rf, gf, bf) - min(rf, gf, bf)
    let v = Float(min(1, max(0, f(lum, sat))))
    let i = ((b * n + g) * n + r) * 4
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 1
  } } }
  let cube = CIFilter.colorCube()
  cube.cubeDimension = Float(n)
  cube.cubeData = data.withUnsafeBufferPointer { Data(buffer: $0) }
  return cube
}
func mapGrey(_ image: CIImage, _ f: @escaping (Double, Double) -> Double) -> CIImage {
  let cube = greyCube(f)
  cube.setValue(image, forKey: kCIInputImageKey)
  return cube.outputImage!.cropped(to: extent)
}

var out: CIImage
/// White where the subject is: the person matte, or the logo's own alpha. Outlines trace its edge.
var shapeMask: CIImage
if let lift = personLift {
  let request = VNGeneratePersonSegmentationRequest()
  request.qualityLevel = .accurate
  request.outputPixelFormat = kCVPixelFormatType_OneComponent8
  try VNImageRequestHandler(ciImage: input).perform([request])
  var mask = CIImage(cvPixelBuffer: request.results!.first!.pixelBuffer)
  mask = mask.transformed(by: CGAffineTransform(scaleX: extent.width / mask.extent.width, y: extent.height / mask.extent.height))
  shapeMask = mask
  // Saturation is weighted by brightness, so a vivid highlight lifts but a dark tinted hat doesn't.
  let lifted = mapGrey(input) { lum, sat in lift + (1 - lift) * min(1, pow(lum, 1.8) + 1.4 * sat * sqrt(lum)) }
  out = lifted.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: black, kCIInputMaskImageKey: mask])
} else {
  shapeMask = input.applyingFilter("CIColorMatrix", parameters: [
    "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 1), "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 1),
    "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 1), "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0),
    "inputBiasVector": CIVector(x: 0, y: 0, z: 0, w: 1),
  ]).cropped(to: extent)
  let flat = input.composited(over: black)
  out = mapGrey(flat) { lum, _ in
    guard let f = floorLevel else { return lum }
    return lum < 0.06 ? 0 : max(lum, f)
  }
}

if let r = outline {
  // Clamped first, so a subject cut off by the picture's border isn't outlined along that border.
  let edge = shapeMask.clampedToExtent().applyingFilter("CIMorphologyGradient", parameters: [kCIInputRadiusKey: r]).cropped(to: extent)
  out = edge.applyingFilter("CILightenBlendMode", parameters: [kCIInputBackgroundImageKey: out]).cropped(to: extent)
}

let s = min(1, maxSide / max(extent.width, extent.height))
let pad: CGFloat = 8 // a black margin so outlines never touch the canvas edge
let scaled = out.transformed(by: CGAffineTransform(translationX: -extent.minX, y: -extent.minY))
  .applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: s, kCIInputAspectRatioKey: 1])
let size = CGSize(width: (extent.width * s).rounded() + pad * 2, height: (extent.height * s).rounded() + pad * 2)
let framed = scaled.transformed(by: CGAffineTransform(translationX: pad, y: pad))
  .composited(over: CIImage(color: .black).cropped(to: CGRect(origin: .zero, size: size)))
let cg = ci.createCGImage(framed, from: CGRect(origin: .zero, size: size))!
try! NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[1]))
print("wrote \(args[1]) \(Int(size.width))×\(Int(size.height))")
