import React from 'react';
import debounce from './util/debounce';

export default class BottomScroller extends React.Component {
  constructor(props) {
    super(props);
    this.delayUpdate = debounce(this.delayUpdate.bind(this), 10);
  }

  componentDidMount() {
    window.addEventListener('resize', this.delayUpdate);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.delayUpdate);
  }

  componentWillUpdate() {
    // You are "at the bottom" if the scroll is within epsilon of the bottom
    // currently.
    let epsilon = 10;
    this.isScrolledToBottom = this.refs.container.scrollTop + this.refs.container.clientHeight + epsilon >= this.refs.container.scrollHeight;
  }

  componentDidUpdate() {
    let container = this.refs.container,
        contents = this.refs.contents,
        spacerHeight = Math.max(0, container.clientHeight - contents.scrollHeight);
    this.refs.spacer.style.height = spacerHeight + "px";
    if (this.isScrolledToBottom) {
      this.scrollToBottom();
    }
  }

  render() {
    return (
      <div ref="container" {...this.props}>
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

  scrollToBottom() {
    this.refs.container.scrollTop = this.refs.container.scrollHeight;
  }
}
