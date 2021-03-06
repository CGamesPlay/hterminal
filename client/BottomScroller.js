import React from 'react';
import ReactDOM from 'react-dom';
import debounce from './util/debounce';

export default class BottomScroller extends React.Component {
  constructor(props) {
    super(props);
    this.isScrolledToBottom = true;
    this.delayUpdate = debounce(this.delayUpdate.bind(this), 10);
    this.handleScroll = debounce(this.handleScrollImmediate.bind(this), 250);
    this.handleDOMMutation = this.handleDOMMutation.bind(this);
    this.domMutationObserver = new MutationObserver(this.handleDOMMutation);
  }

  componentDidMount() {
    this.setSpacerHeight();
    window.addEventListener('resize', this.delayUpdate);

    let config = { attributes: true, childList: true, characterData: true, subtree: true };
    this.domMutationObserver.observe(ReactDOM.findDOMNode(this), config);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.delayUpdate);
    this.domMutationObserver.disconnect();
  }

  componentDidUpdate() {
    this.setSpacerHeight();

    // When contents are removed from the BottomScroller it might cause us to be
    // scrolled to the bottom as a result, so we need to check the old value in
    // addition to the new one in order to decide whether or not to scroll.
    var wasScrolledToBottom = this.isScrolledToBottom;
    this.handleScrollImmediate();
    if (wasScrolledToBottom || this.isScrolledToBottom) {
      this.scrollToBottom();
    }
  }

  render() {
    var { style, ...other } = this.props;

    style = Object.assign({
      overflowX: "hidden",
      overflowY: "scroll",
    }, style);

    return (
      <div ref="container" style={style} onScroll={this.handleScroll} {...other}>
        <div ref="spacer" />
        <div ref="contents">
          {this.props.children}
        </div>
      </div>
    );
  }

  setSpacerHeight() {
    let container = this.refs.container,
        contents = this.refs.contents,
        spacerHeight = Math.max(0, container.clientHeight - contents.clientHeight);
    this.refs.spacer.style.height = spacerHeight + "px";
  }

  delayUpdate() {
    this.componentDidUpdate();
  }

  handleScrollImmediate() {
    // You are "at the bottom" if currently scrolled within epsilon of the bottom.
    let epsilon = 10;
    this.isScrolledToBottom = this.refs.container.scrollTop + this.refs.container.clientHeight + epsilon >= this.refs.container.scrollHeight;
  }

  handleDOMMutation(mutations) {
    this.componentDidUpdate();
  }

  scrollToBottom() {
    this.refs.container.scrollTop = this.refs.container.scrollHeight;
    this.isScrolledToBottom = true;
  }
}
