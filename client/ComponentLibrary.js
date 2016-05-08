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

export default {
  'multi-column-list': MultiColumnList,
  'file-pill': FilePill,
};
