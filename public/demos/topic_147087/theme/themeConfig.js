(function (global) {
  'use strict';

  global.TT = global.TT || {};

  global.TT.themeConfig = {
    default: {
      node: {
        baseClass: 'tt-node',
        importance: {
          breakthrough: 'tt-node--breakthrough',
          important: 'tt-node--important',
          minor: 'tt-node--minor'
        },
        state: {
          selected: 'is-selected',
          edited: 'is-edited',
          focus: 'is-focus',
          blur: 'is-blur'
        }
      },
      toolbar: {
        baseClass: 'tt-toolbar',
        visible: 'is-visible'
      },
      column: {
        baseClass: 'tt-column',
        main: 'tt-column--main',
        extra: 'tt-column--extra',
        branch: 'tt-column--branch'
      }
    }
  };

})(window);
