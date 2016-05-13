import React from 'react';
import debounce from './util/debounce';

export default class BottomScroller extends React.Component {
  constructor(props) {
    super(props);
    this.isScrolledToBottom = true;
    this.delayUpdate = debounce(this.delayUpdate.bind(this), 10);
    this.handleScroll = debounce(this.handleScroll.bind(this), 250);
  }

  componentDidMount() {
    window.addEventListener('resize', this.delayUpdate);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.delayUpdate);
  }

  componentDidUpdate() {
    let container = this.refs.container,
        contents = this.refs.contents,
        spacerHeight = Math.max(0, container.clientHeight - contents.scrollHeight);
    this.refs.spacer.style.height = spacerHeight + "px";

    // When contents are removed from the BottomScroller it might cause us to be
    // scrolled to the bottom as a result, so we need to check the old value in
    // addition to the new one in order to decide whether or not to scroll.
    var wasScrolledToBottom = this.isScrolledToBottom;
    this.handleScroll();
    if (wasScrolledToBottom || this.isScrolledToBottom) {
      this.scrollToBottom();
    }
  }

  render() {
    var { style, ...other } = this.props;

    style = Object.assign({
      width: "100%",
      height: "100%",
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

  delayUpdate() {
    this.forceUpdate();
  }

  handleScroll() {
    // You are "at the bottom" if currently scrolled within epsilon of the bottom.
    let epsilon = 10;
    this.isScrolledToBottom = this.refs.container.scrollTop + this.refs.container.clientHeight + epsilon >= this.refs.container.scrollHeight;
  }

  scrollToBottom() {
    this.refs.container.scrollTop = this.refs.container.scrollHeight;
    this.isScrolledToBottom = true;
  }
}
