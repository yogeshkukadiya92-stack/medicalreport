@objc(DocumentScanner)
class DocumentScanner: NSObject, RCTBridgeModule, VNDocumentCameraViewControllerDelegate, QLPreviewControllerDataSource {
  private var scanResolve: RCTPromiseResolveBlock?
  private var scanReject: RCTPromiseRejectBlock?
  private var previewURL: URL?
  private let imageContext = CIContext(options: [.useSoftwareRenderer: false])

  static func moduleName() -> String! { "DocumentScanner" }
  static func requiresMainQueueSetup() -> Bool { true }

  @objc(scan:rejecter:)
  func scan(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard VNDocumentCameraViewController.isSupported else {
        reject("SCANNER_UNAVAILABLE", "Document scanning is not available on this device.", nil)
        return
      }
      guard let presenter = Self.topViewController() else {
        reject("SCANNER_PRESENTATION_FAILED", "Unable to open the document scanner.", nil)
        return
      }
      self.scanResolve = resolve
      self.scanReject = reject
      let scanner = VNDocumentCameraViewController()
      scanner.delegate = self
      scanner.modalPresentationStyle = .fullScreen
      presenter.present(scanner, animated: true)
    }
  }

  @objc(enhanceImage:resolver:rejecter:)
  func enhanceImage(
    _ uri: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let sourceURL = URL(string: uri) ?? URL(fileURLWithPath: uri)
        let outputURL = Self.temporaryJPEGURL(prefix: "enhanced-report")
        let data: Data
        if sourceURL.pathExtension.lowercased() == "pdf" {
          data = try self.renderFirstPDFPage(sourceURL)
        } else {
          guard let source = CIImage(contentsOf: sourceURL, options: [.applyOrientationProperty: true]) else {
            throw DocumentScannerError.unreadableImage
          }
          let enhanced = try self.perspectiveCorrected(source)
            .applyingFilter("CIColorControls", parameters: [
              kCIInputBrightnessKey: 0.025,
              kCIInputContrastKey: 1.16,
              kCIInputSaturationKey: 0.82,
            ])
            .applyingFilter("CISharpenLuminance", parameters: ["inputSharpness": 0.42])
          guard let imageData = self.imageContext.jpegRepresentation(
            of: enhanced,
            colorSpace: CGColorSpaceCreateDeviceRGB(),
            options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.93]
          ) else { throw DocumentScannerError.encodingFailed }
          data = imageData
        }
        try data.write(to: outputURL, options: .atomic)
        resolve(Self.filePayload(url: outputURL, size: data.count))
      } catch {
        reject("IMAGE_ENHANCEMENT_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc(previewRemoteFile:token:fileName:resolver:rejecter:)
  func previewRemoteFile(
    _ urlString: String,
    token: String,
    fileName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let url = URL(string: urlString) else {
      reject("INVALID_FILE_URL", "The report file URL is invalid.", nil)
      return
    }
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error {
        reject("FILE_DOWNLOAD_FAILED", error.localizedDescription, error)
        return
      }
      guard let http = response as? HTTPURLResponse,
            (200..<300).contains(http.statusCode),
            let data else {
        reject("FILE_DOWNLOAD_FAILED", "The original report could not be downloaded.", nil)
        return
      }
      do {
        let safeName = fileName.replacingOccurrences(of: "/", with: "-")
        let target = FileManager.default.temporaryDirectory
          .appendingPathComponent("preview-\(UUID().uuidString)-\(safeName)")
        try data.write(to: target, options: .atomic)
        DispatchQueue.main.async {
          guard let presenter = Self.topViewController() else {
            reject("PREVIEW_FAILED", "The report preview could not be opened.", nil)
            return
          }
          self.previewURL = target
          let preview = QLPreviewController()
          preview.dataSource = self
          presenter.present(preview, animated: true) { resolve(true) }
        }
      } catch {
        reject("FILE_SAVE_FAILED", error.localizedDescription, error)
      }
    }.resume()
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    previewURL == nil ? 0 : 1
  }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    previewURL! as NSURL
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true)
    scanReject?("SCAN_CANCELLED", "Document scanning was cancelled.", nil)
    clearScanCallbacks()
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
    controller.dismiss(animated: true)
    scanReject?("SCAN_FAILED", error.localizedDescription, error)
    clearScanCallbacks()
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFinishWith scan: VNDocumentCameraScan
  ) {
    do {
      var pages: [[String: Any]] = []
      for index in 0..<scan.pageCount {
        guard let data = scan.imageOfPage(at: index).jpegData(compressionQuality: 0.94) else {
          throw DocumentScannerError.encodingFailed
        }
        let url = Self.temporaryJPEGURL(prefix: "scan-page-\(index + 1)")
        try data.write(to: url, options: .atomic)
        pages.append(Self.filePayload(url: url, size: data.count))
      }
      controller.dismiss(animated: true)
      scanResolve?(pages)
    } catch {
      controller.dismiss(animated: true)
      scanReject?("SCAN_SAVE_FAILED", error.localizedDescription, error)
    }
    clearScanCallbacks()
  }

  private func perspectiveCorrected(_ image: CIImage) throws -> CIImage {
    let request = VNDetectRectanglesRequest()
    request.maximumObservations = 1
    request.minimumConfidence = 0.62
    request.minimumAspectRatio = 0.3
    request.quadratureTolerance = 25
    try VNImageRequestHandler(ciImage: image, orientation: .up).perform([request])
    guard let rectangle = request.results?.first else { return image }
    let extent = image.extent
    func point(_ normalized: CGPoint) -> CIVector {
      CIVector(x: extent.origin.x + normalized.x * extent.width,
               y: extent.origin.y + normalized.y * extent.height)
    }
    return image.applyingFilter("CIPerspectiveCorrection", parameters: [
      "inputTopLeft": point(rectangle.topLeft),
      "inputTopRight": point(rectangle.topRight),
      "inputBottomLeft": point(rectangle.bottomLeft),
      "inputBottomRight": point(rectangle.bottomRight),
    ])
  }

  private func clearScanCallbacks() {
    scanResolve = nil
    scanReject = nil
  }

  private func renderFirstPDFPage(_ url: URL) throws -> Data {
    guard let document = PDFDocument(url: url), let page = document.page(at: 0) else {
      throw DocumentScannerError.unreadablePDF
    }
    let bounds = page.bounds(for: .mediaBox)
    let scale = min(2, 1500 / max(bounds.width, bounds.height))
    let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
    let renderer = UIGraphicsImageRenderer(size: size)
    let image = renderer.image { context in
      UIColor.white.setFill()
      context.fill(CGRect(origin: .zero, size: size))
      context.cgContext.translateBy(x: 0, y: size.height)
      context.cgContext.scaleBy(x: scale, y: -scale)
      page.draw(with: .mediaBox, to: context.cgContext)
    }
    guard let data = image.jpegData(compressionQuality: 0.86) else {
      throw DocumentScannerError.encodingFailed
    }
    return data
  }

  private static func temporaryJPEGURL(prefix: String) -> URL {
    FileManager.default.temporaryDirectory.appendingPathComponent("\(prefix)-\(UUID().uuidString).jpg")
  }

  private static func filePayload(url: URL, size: Int) -> [String: Any] {
    ["uri": url.absoluteString, "name": url.lastPathComponent, "mimeType": "image/jpeg", "size": size, "enhanced": true]
  }

  private static func topViewController(
    from root: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.keyWindow }
      .first?.rootViewController
  ) -> UIViewController? {
    if let navigation = root as? UINavigationController { return topViewController(from: navigation.visibleViewController) }
    if let tabs = root as? UITabBarController, let selected = tabs.selectedViewController { return topViewController(from: selected) }
    if let presented = root?.presentedViewController { return topViewController(from: presented) }
    return root
  }
}

private enum DocumentScannerError: LocalizedError {
  case encodingFailed
  case unreadableImage
  case unreadablePDF

  var errorDescription: String? {
    switch self {
    case .encodingFailed: return "The scanned image could not be prepared."
    case .unreadableImage: return "The selected image could not be read."
    case .unreadablePDF: return "The selected PDF does not contain a readable page."
    }
  }
}
