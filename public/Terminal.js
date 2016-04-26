import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import BottomScroller from './BottomScroller';
import CSS from './Terminal.css';
import debounce from './util/debounce';

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
    this.refs.input.focus();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.driver !== this.props.driver) {
      newProps.driver.on('output', this.delayUpdate);
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
        <BottomScroller ref="scroller" className={CSS.terminalOutput}>
          {cells}
        </BottomScroller>
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
      this.refs.scroller.scrollToBottom();
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
}
