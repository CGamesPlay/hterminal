import React from 'react';
import ReactDOM from 'react-dom';
import BottomScroller from './BottomScroller';
import debounce from './util/debounce';
import { inputFromEvent } from './KeyEvent';
import { SectionGroup, Section } from './SectionGroup';

import './Terminal.css';

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    // These methods need to be bound because they are used to add/remove event
    // listeners
    this.forceUpdate = this.forceUpdate.bind(this);
    this.delayResize = debounce(this.calculateWindowSize.bind(this), 100);
    this.handleExit = this.handleExit.bind(this);
    this.handleExecute = this.handleExecute.bind(this);
  }

  componentDidMount() {
    this.addListenersToDriver(this.props.driver);
    this.refs.container.addEventListener('keydown', this.handleKeyEvent.bind(this), false);
    this.refs.container.addEventListener('keypress', this.handleKeyEvent.bind(this), false);
    this.refs.container.focus();

    this.calculateWindowSize();
    window.addEventListener('resize', this.delayResize, false);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.driver !== this.props.driver) {
      this.removeListenersFromDriver(this.props.driver);
      this.addListenersToDriver(newProps.driver);
    }
  }

  addListenersToDriver(driver) {
    driver.on('update', this.forceUpdate);
    driver.on('exit', this.handleExit);

    driver.setFixedSections([ "hterminal-status" ]);
  }

  removeListenersFromDriver(driver) {
    driver.removeListener('update', this.forceUpdate);
    driver.removeListener('exit', this.handleExit);
  }

  render() {
    let groups = this.props.driver.groups.map((r, i) =>
      <SectionGroup
        key={r.uniqueId}
        group={r}
        readOnly={r.isFinished() || i != this.props.driver.groups.length - 1}
        onExecute={this.handleExecute} />
    );
    return (
      <div ref="container" className="terminal" tabIndex={-1} onPaste={this.handlePaste.bind(this)}>
        <BottomScroller ref="scroller" className="terminal-content">
          {groups}
        </BottomScroller>
        {this.renderStatusBar()}
      </div>
    );
  }

  renderStatusBar() {
    let section = this.props.driver.fixedSections["hterminal-status"];
    // Only show the status bar if it has contents
    if (section && section.content.length > 0) {
      return (
        <Section className="status-bar"
          style={{ padding: this.props.minimumPadding }}
          section={section}
          onExecute={this.handleExecute.bind(this)}
          onUpdate={this.calculateWindowSize.bind(this)} />
      );
    } else {
      return null;
    }
  }

  handleKeyEvent(e) {
    var input = inputFromEvent(e, this.props.driver.keypadMode);
    if (input.length > 0) {
      e.preventDefault();
      this.refs.scroller.scrollToBottom();
      this.props.onInput(input);
    }
  }

  handlePaste(e) {
    if (e.clipboardData.types.indexOf("text/plain") != -1) {
      let pasted = e.clipboardData.getData("text/plain");
      e.preventDefault();
      this.refs.scroller.scrollToBottom();
      this.props.onInput(pasted);
    }
  }

  handleExecute(command) {
    this.props.onInput(command + "\r");
  }

  handleExit(code, status) {
    window.close();
  }

  calculateFontSize() {
    var currentStyle = window.getComputedStyle(this.refs.container);
    var styleKey = currentStyle.fontFamily + ":" + currentStyle.fontSize;
    if (this.styleKey != styleKey) {
      var el = document.createElement("SPAN");
      var scrollerNode = ReactDOM.findDOMNode(this.refs.scroller);
      el.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      scrollerNode.appendChild(el);
      this.fontMetrics = [ el.offsetWidth / 26, el.offsetHeight ];
      scrollerNode.removeChild(el);
      this.styleKey = styleKey;
    }
    return this.fontMetrics;
  }

  calculateWindowSize() {
    var fontMetrics = this.calculateFontSize();
    var clientNode = ReactDOM.findDOMNode(this.refs.scroller);
    // We require that there is whitespace around the left, right, and bottom.
    // We apply the same padding to the top of the window, but the calculations
    // don't include it because it will only be shown when the window is
    // scrolled up.
    var clientWidth = clientNode.clientWidth - this.props.minimumPadding * 2;
    var clientHeight = clientNode.clientHeight - this.props.minimumPadding;

    var columns = Math.floor(clientWidth / fontMetrics[0]);
    var rows = Math.floor(clientHeight / fontMetrics[1]);

    this.paddingX = clientWidth % fontMetrics[0];
    this.paddingY = clientHeight % fontMetrics[1];
    clientNode.style.paddingLeft = Math.floor(this.props.minimumPadding + this.paddingX / 2) + "px";
    clientNode.style.paddingRight = Math.ceil(this.props.minimumPadding + this.paddingX / 2) + "px";
    clientNode.style.paddingTop = Math.floor(this.props.minimumPadding + this.paddingY / 2) + "px";
    clientNode.style.paddingBottom = Math.ceil(this.props.minimumPadding + this.paddingY / 2) + "px";

    if ((columns != this.props.initialColumns || rows != this.props.initialRows) && this.props.onResize) {
      this.props.onResize(columns, rows);
    }
  }
}

Terminal.defaultProps = {
  // Default padding around each edge
  minimumPadding: 3,
}
