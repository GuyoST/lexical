/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {HeadingTagType} from '@lexical/rich-text';
import type {NodeKey} from 'lexical';

import '../ui/TableOfContentsStyle.css';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import LexicalTableOfContents__EXPERIMENTAL from '@lexical/react/LexicalTableOfContents__EXPERIMENTAL';
import {useEffect, useRef, useState} from 'react';
import * as React from 'react';

function indent(tagName: HeadingTagType) {
  if (tagName === 'h2') {
    return 'heading2';
  } else if (tagName === 'h3') {
    return 'heading3';
  }
}

function TableOfContentsList({
  tableOfContents,
}: {
  tableOfContents: Array<[key: NodeKey, text: string, tag: HeadingTagType]>;
}): JSX.Element {
  const [selectedKey, setSelectedKey] = useState('');
  const selectedIndex = useRef(0);
  const [editor] = useLexicalComposerContext();

  function scrollToNode(key: NodeKey, currIndex: number) {
    editor.getEditorState().read(() => {
      const domElement = editor.getElementByKey(key);
      if (domElement !== null) {
        domElement.scrollIntoView();
        setSelectedKey(key);
        selectedIndex.current = currIndex;
      }
    });
  }
  function isElementAtTheTopOfThePage(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition > 0.26 && elementYPosition < 9;
  }
  function isElementAboveViewport(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition <= 0;
  }
  function isElementBelowTheTopOfThePage(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition > 9;
  }

  function scrollCallback() {
    if (tableOfContents.length !== 0) {
      let currentHeading = editor.getElementByKey(
        tableOfContents[selectedIndex.current][0],
      );
      if (currentHeading !== null) {
        if (isElementAboveViewport(currentHeading)) {
          //On natural scroll, user is scrolling down
          while (
            currentHeading !== null &&
            isElementAboveViewport(currentHeading) &&
            selectedIndex.current >= 0
          ) {
            const nextHeading = editor.getElementByKey(
              tableOfContents[selectedIndex.current + 1][0],
            );
            if (
              nextHeading !== null &&
              isElementBelowTheTopOfThePage(nextHeading)
            ) {
              break;
            } else {
              const nextHeadingKey =
                tableOfContents[++selectedIndex.current][0];
              setSelectedKey(nextHeadingKey);
              currentHeading = nextHeading;
            }
          }
        } else if (isElementBelowTheTopOfThePage(currentHeading)) {
          //On natural scroll, user is scrolling up
          while (
            currentHeading !== null &&
            isElementBelowTheTopOfThePage(currentHeading) &&
            selectedIndex.current > 0
          ) {
            const prevHeading = editor.getElementByKey(
              tableOfContents[selectedIndex.current - 1][0],
            );
            if (
              prevHeading !== null &&
              isElementBelowTheTopOfThePage(currentHeading) &&
              (isElementAboveViewport(prevHeading) ||
                isElementAtTheTopOfThePage(prevHeading))
            ) {
              const prevHeadingKey =
                tableOfContents[--selectedIndex.current][0];
              setSelectedKey(prevHeadingKey);
              break;
            } else {
              const prevHeadingKey =
                tableOfContents[--selectedIndex.current][0];
              setSelectedKey(prevHeadingKey);
              currentHeading = prevHeading;
            }
          }
        }
      }
    }
  }

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    function debounceFunction(func: () => void, delay: number) {
      clearTimeout(timerId);
      timerId = setTimeout(func, delay);
    }

    function onScroll(): void {
      debounceFunction(scrollCallback, 10);
    }

    document.addEventListener('scroll', onScroll);
    return () => document.removeEventListener('scroll', onScroll);
  });

  return (
    <ul className="table-of-contents">
      {tableOfContents.map(([key, text, tag], index) => (
        <div
          className={selectedKey === key ? 'selectedHeading' : 'heading'}
          key={key}
          onClick={() => scrollToNode(key, index)}
          role="button"
          tabIndex={0}>
          <div className={selectedKey === key ? 'circle' : 'bar'} />
          <li className={indent(tag)}>
            {('' + text).length > 27 ? text.substring(0, 27) + '...' : text}
          </li>
        </div>
      ))}
    </ul>
  );
}

export default function TableOfContentsPlugin() {
  return (
    <LexicalTableOfContents__EXPERIMENTAL>
      {(tableOfContents) => {
        return <TableOfContentsList tableOfContents={tableOfContents} />;
      }}
    </LexicalTableOfContents__EXPERIMENTAL>
  );
}
