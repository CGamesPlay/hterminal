import React from 'react';
import CSS from './ComponentLibrary.css';

export class MultiColumnList extends React.Component {
  render() {
    return (
      <ul className="multi-column-list">
        {this.props.children}
      </ul>
    );
  }
}

export class FilePill extends React.Component {
  render() {
    return <li className="file-pill">{this.props.children}</li>;
  }
}

export class FramedImage extends React.Component {
  render() {
    let style = {
      maxWidth: document.body.clientWidth * .8,
      maxHeight: document.body.clientHeight * .8,
    };
    return <img className="framed-image" style={style} src={this.props.src} />;
  }
}

export default {
  'multi-column-list': MultiColumnList,
  'file-pill': FilePill,
  'framed-image': FramedImage,
};
