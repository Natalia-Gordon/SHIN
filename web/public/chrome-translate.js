/**
 * Chrome's translator wraps text nodes in font elements while the page is open.
 * Angular then tries to move nodes that no longer have the parent it expects,
 * and the app crashes. These guards keep the translated page running.
 * The document stays translatable: this file does not set translate="no".
 */
(function () {
  var proto = Node.prototype;
  if (proto.__shinChromeTranslate) return;
  proto.__shinChromeTranslate = true;

  var removeChild = proto.removeChild;
  proto.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child);
  };

  var insertBefore = proto.insertBefore;
  proto.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return insertBefore.call(this, newNode, referenceNode);
  };

  var replaceChild = proto.replaceChild;
  proto.replaceChild = function (newChild, oldChild) {
    if (oldChild.parentNode !== this) return oldChild;
    return replaceChild.call(this, newChild, oldChild);
  };
})();
