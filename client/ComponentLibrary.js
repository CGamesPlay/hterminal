import React from 'react';
import classnames from 'classnames';
import CSS from './ComponentLibrary.css';

function basicTag(name, attributes) {
  var tag = { name: name };
  if (attributes) {
    tag.propTypes = attributes;
  }
  return tag;
}

var allowedTags = [
  'div', 'span', 'strong', 'b', 'i', 'em', 'u', 'strike',
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tfoot', 'tbody', 'tr', 'th', 'td', 'caption',
  'ul', 'ol', 'li',
].reduce((memo, tag) => { memo[tag] = basicTag(tag); return memo; }, {});
allowedTags['a'] = basicTag('a', { href: React.PropTypes.string });
allowedTags['img'] = basicTag('img', { src: React.PropTypes.string });

export class Icon extends React.Component {
  render() {
    return (
      <i className={"fa fa-" + this.props.id} />
    );
  }
}

Icon.propTypes = {
  id: React.PropTypes.string.isRequired,
};

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

FramedImage.propTypes = {
  src: React.PropTypes.string
};

export default Object.assign({}, allowedTags, {
  'icon': Icon,
  'multi-column-list': MultiColumnList,
  'file-pill': FilePill,
  'framed-image': FramedImage,
});
