import React     from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

ReactableTableCell = createReactClass({

  propTypes: {
    row:       PropTypes.object.isRequired,
    classes:   PropTypes.string,
    rowNumber: PropTypes.number,
    colNumber: PropTypes.number,
    label:     PropTypes.string,
  },

  render () {
    return (
      <td className={ this.props.classes }>
        { this.props.children }
      </td>
    );
  },

})
