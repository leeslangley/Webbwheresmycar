// GameViewController: full-screen WKWebView hosting the game, loaded from the
// bundled files via the custom `webb://` scheme.

import UIKit
import WebKit

final class GameViewController: UIViewController {
	private var webView: WKWebView?

	override func viewDidLoad() {
		super.viewDidLoad()

		let wwwURL = Bundle.main.resourceURL!.appendingPathComponent("www")
		let configuration = WKWebViewConfiguration()
		configuration.setURLSchemeHandler(AssetSchemeHandler(root: wwwURL), forURLScheme: "webb")
		configuration.allowsInlineMediaPlayback = true
		configuration.mediaTypesRequiringUserActionForPlayback = []

		let view = WKWebView(frame: self.view.bounds, configuration: configuration)
		view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		view.backgroundColor = .black
		view.isOpaque = false
		view.scrollView.isScrollEnabled = false
		view.scrollView.bounces = false
		view.scrollView.contentInsetAdjustmentBehavior = .never
#if DEBUG
		view.isInspectable = true
#endif
		self.view.addSubview(view)
		self.webView = view

		let request = URLRequest(url: URL(string: "webb://app/index.html")!)
		view.load(request)
	}

	override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
		.landscape
	}

	override var prefersStatusBarHidden: Bool {
		true
	}

	override var prefersHomeIndicatorAutoHidden: Bool {
		true
	}

	override var shouldAutorotate: Bool {
		true
	}
}
