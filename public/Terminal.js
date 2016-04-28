import React from 'react';
import ReactDOM from 'react-dom';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import BottomScroller from './BottomScroller';
import CSS from './Terminal.css';
import debounce from './util/debounce';

function inputFromEvent(event) {
  if (event.type == "keypress") {
    if (event.metaKey) {
      // Don't process OS shortcuts
      return "";
    }
    let charCode = event.keyCode;
    if (charCode < 16 || charCode == 27) {
      // Pass direct for NL, BS, etc
    } else if (charCode < 32) {
      // Modifier key
      return "";
    } else if (charCode >= 64 && charCode < 91) {
      if (!event.shiftKey) {
        charCode += 32;
      }
      if (event.ctrlKey) {
        charCode -= 96;
      }
    }
    return String.fromCharCode(charCode);
  } else if (event.type == "keydown") {
    if (event.keyCode < 16 || event.keyCode == 27) {
      // Control characters on a keyboard. Pass through.
      return String.fromCharCode(event.keyCode);
    } else if (event.code == "Delete") {
      return String.fromCharCode(127);
    } else {
      return "";
    }
  } else {
    return "";
  }
}

export class Section extends React.Component {
  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  render() {
    let section = this.props.section;

    if (section.type == "html") {
      let payload = { __html: section.content };
      return (
        <div className={CSS.htmlSection} dangerouslySetInnerHTML={payload} onClick={this.handleClick.bind(this)} />
      );
    } else {
      var string = section.toString();
      if (string[string.length - 1] == "\n") {
        // Add a whitespace to force the browser to show the last empty line
        string += " ";
      }
      return (
        <div className={CSS.textSection} onClick={this.handleClick.bind(this)}>{string}</div>
      );
    }
  }

  handleClick(e) {
    if (e.target.tagName == "A") {
      if (e.target.href.startsWith("cmd://")) {
        // This link is a command to run
        e.preventDefault();
        let command = unescape(e.target.href.slice(6));
        if (this.props.onExecute) {
          this.props.onExecute(command);
        }
      }
    }
  }
}

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.delayUpdate = debounce(this.delayUpdate.bind(this), 10);
  }

  componentDidMount() {
    this.props.driver.on('output', this.delayUpdate);
    this.refs.container.addEventListener('keydown', this.handleKeyEvent.bind(this), false);
    this.refs.container.addEventListener('keypress', this.handleKeyEvent.bind(this), false);
    this.refs.container.focus();
    this.calculateWindowSize();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.driver !== this.props.driver) {
      newProps.driver.on('output', this.delayUpdate);
    }
  }

  componentDidUpdate() {
    this.calculateWindowSize();
  }

  render() {
    let sections = this.props.driver.sections.map((s, i) =>
      <Section
        key={i}
        section={s}
        mutable={i == this.props.driver.sections.length - 1}
        onExecute={this.handleExecute.bind(this)} />
    );
    return (
      <div ref="container" className={CSS.terminal} tabIndex={-1}>
        <BottomScroller ref="scroller" className={CSS.terminalContents}>
          {sections}
        </BottomScroller>
      </div>
    );
  }

  handleKeyEvent(e) {
    var input = inputFromEvent(e);
    if (input.length > 0) {
      e.preventDefault();
      this.refs.scroller.scrollToBottom();
      this.props.onInput(input);
    }
  }

  handleExecute(command) {
    this.props.onInput(command + "\r");
  }

  delayUpdate() {
    this.forceUpdate();
  }

  calculateFontSize() {
    var currentStyle = window.getComputedStyle(this.refs.container);
    var styleKey = currentStyle.fontFamily + ":" + currentStyle.fontSize;
    if (this.styleKey != styleKey) {
      var el = document.createElement("SPAN");
      el.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      this.refs.container.appendChild(el);
      this.fontMetrics = [ el.offsetWidth / 26, el.offsetHeight ];
      this.refs.container.removeChild(el);
      this.styleKey = styleKey;
    }
    return this.fontMetrics;
  }

  calculateWindowSize() {
    var fontMetrics = this.calculateFontSize();
    var clientNode = ReactDOM.findDOMNode(this);
    var clientWidth = clientNode.clientWidth - this.props.minimumPadding * 2;
    var clientHeight = clientNode.clientHeight - this.props.minimumPadding * 2;

    var columns = Math.floor(clientWidth / fontMetrics[0]);
    var rows = Math.floor(clientHeight / fontMetrics[1]);

    this.paddingX = clientNode.clientWidth % fontMetrics[0];
    this.paddingY = clientNode.clientHeight % fontMetrics[1];
    clientNode.style.paddingLeft =
      clientNode.style.paddingRight =
      this.props.minimumPadding + this.paddingX / 2 + "px";
    clientNode.style.paddingTop =
      clientNode.style.paddingBottom =
      this.props.minimumPadding + this.paddingY / 2 + "px";

    if ((columns != this.props.initialColumns || rows != this.props.initialRows) && this.props.onResize) {
      this.props.onResize(columns, rows);
    }
  }
}

Terminal.defaultProps = {
  // Default padding around each edge
  minimumPadding: 5,
}
