// AssetSchemeHandler: serves the bundled game files over the custom `webb://`
// URL scheme. ES modules do not load from file:// inside WKWebView, so the app
// maps `webb://app/<path>` onto files inside <resource bundle>/www.

import WebKit

final class AssetSchemeHandler: NSObject, WKURLSchemeHandler {
	private let root: URL

	init(root: URL) {
		self.root = root
		super.init()
	}

	private static func contentType(forExtension ext: String) -> String {
		switch ext.lowercased() {
		case "html": return "text/html; charset=utf-8"
		case "js", "mjs": return "text/javascript; charset=utf-8"
		case "json", "webmanifest": return "application/json"
		case "css": return "text/css"
		case "png": return "image/png"
		case "jpg", "jpeg": return "image/jpeg"
		case "svg": return "image/svg+xml"
		case "woff2": return "font/woff2"
		case "woff": return "font/woff"
		case "ttf": return "font/ttf"
		case "mp3": return "audio/mpeg"
		case "wav": return "audio/wav"
		default: return "application/octet-stream"
		}
	}

	private func respond(_ task: WKURLSchemeTask, status: Int, contentType: String, data: Data) {
		let headers = [
			"Content-Type": contentType,
			"Content-Length": String(data.count),
			"Access-Control-Allow-Origin": "*",
		]
		let response = HTTPURLResponse(
			url: task.request.url!,
			statusCode: status,
			httpVersion: "HTTP/1.1",
			headerFields: headers
		)!
		task.didReceive(response)
		task.didReceive(data)
		task.didFinish()
	}

	func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
		// `/` maps onto /index.html; anything escaping the bundle root is a 404.
		var path = task.request.url?.path ?? "/"
		if path.hasPrefix("/") {
			path = String(path.dropFirst())
		}
		if path.isEmpty {
			path = "index.html"
		}
		if path.contains("..") {
			respond(task, status: 404, contentType: "text/plain", data: Data())
			return
		}
		let fileURL = root.appendingPathComponent(path)
		guard let data = try? Data(contentsOf: fileURL) else {
			respond(task, status: 404, contentType: "text/plain", data: Data())
			return
		}
		let ext = (path as NSString).pathExtension
		let contentType = Self.contentType(forExtension: ext)
		respond(task, status: 200, contentType: contentType, data: data)
	}

	func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
		// Reads are synchronous, so there is nothing to cancel.
	}
}
