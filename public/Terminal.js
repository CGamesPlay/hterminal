import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import CSS from './Terminal.css';

function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  var later = function() {
    var last = Date.now - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = Date.now;
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

const ENTER_KEY_CODE = 13;

export class Cell extends React.Component {
  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  render() {
    let cell = this.props.cell;

    if (cell.type == "html") {
      let payload = { __html: cell.content };
      return (
        <div className={CSS.htmlCell} dangerouslySetInnerHTML={payload} onClick={this.handleClick.bind(this)} />
      );
    } else {
      return (
        <div className={CSS.textCell} onClick={this.handleClick.bind(this)}>{cell.content}</div>
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
    window.addEventListener('resize', this.delayUpdate);
    this.refs.input.focus();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.driver !== this.props.driver) {
      newProps.driver.on('output', this.delayUpdate);
    }
  }

  componentWillUpdate() {
    // You are "at the bottom" if the scroll is within epsilon of the bottom
    // currently.
    let epsilon = 10;
    this.isScrolledToBottom = this.refs.output.scrollTop + this.refs.output.clientHeight + epsilon >= this.refs.output.scrollHeight;
  }

  componentDidUpdate() {
    let output = this.refs.output,
        cellContainer = this.refs.cellContainer,
        spacerHeight = Math.max(0, output.clientHeight - cellContainer.scrollHeight);
    this.refs.topSpacer.style.height = spacerHeight + "px";
    if (this.isScrolledToBottom) {
      this.scrollToBottom();
    }
  }

  render() {
    let cells = this.props.driver.cells.map((c, i) =>
      <Cell
        key={i}
        cell={c}
        mutable={i == this.props.driver.cells.length - 1}
        onExecute={this.handleExecute.bind(this)} />
    );
    return (
      <div className={CSS.terminal} tabIndex={-1} onKeyDown={this.handleKeyDownTerminal.bind(this)}>
        <div ref="output" className={CSS.terminalOutput}>
          <div ref="topSpacer" className={CSS.terminalSpacer} />
          <div ref="cellContainer">
            {cells}
          </div>
        </div>
        <div className={CSS.terminalInput}>
          <input ref="input" onKeyDown={this.handleKeyDown.bind(this)} />
        </div>
      </div>
    );
  }

  handleKeyDownTerminal(e) {
    if (e.target != this.refs.input) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        // Don't focus
      } else {
        if (e.key == "Tab") {
          e.stopPropagation();
          e.preventDefault();
        }
        this.refs.input.focus();
        this.handleKeyDown(e);
      }
    }
  }

  handleKeyDown(e) {
    if (e.keyCode == ENTER_KEY_CODE) {
      e.preventDefault();
      let command = this.refs.input.value;
      this.props.onInput(command + "\r");
      this.refs.input.select();
      this.scrollToBottom();
    } else if (e.key == "Tab") {
      e.preventDefault();
    }
  }

  handleExecute(command) {
    this.props.onInput(command + "\r");
  }

  delayUpdate() {
    this.forceUpdate();
  }

  scrollToBottom() {
    this.refs.output.scrollTop = this.refs.output.scrollHeight;
  }
}
