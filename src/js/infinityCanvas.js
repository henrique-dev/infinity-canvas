/* eslint no-underscore-dangle: 0 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ICanvas = {}));
})(this, (function (exports) { 'use strict';

  /**
  * Applies canvas on element.
  * @constructor
  * @param {HTMLDivElement} element - Element to apply mask
  * @param {Object} options - Custom options
  * @return {InfinityCanvas}
  */
  ICanvas = function(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return new ICanvas.InfinityCanvas(element, options);
  }

  let debug = true;

  let containerWidth;
  let containerHeight;

  let canvasWidth;
  let canvasHeight;

  let canvasDrawWidth;
  let canvasDrawHeight;

  let scrollBarWidth;

  let scrollElementWidth;
  let scrollElementHeight;

  let mainContainer;

  let componentCanvas;
  let componentScrollV;
  let componentScrollH;
  let componentScrollS;

  let fatScrollY;
  let fatScrollX;

  let cameraArea;
  let drawArea;

  let intervalID;
  let refreshRate;

  let onDraw;
  let onScroll;
  let onResize;
  let onMouseMove;
  let onMouseEnter;
  let onMouseUp;
  let onMouseDown;
  let onClick;

  let elements;

  let InfinityCanvas = function () {
    function InfinityCanvas(element, options) {
      if (_elementIsDiv(element)) {
        mainContainer = element;
        _applyOptions(options);
        _init();
        this.resizeElement = _resizeElements;
        window.addEventListener('resize', _resizeElements, false);
      } else return;
    }
    return InfinityCanvas;
  }();

  function _resizeElements() {
    _init();
  }

  function _init() {
    _applyElement();
    _createElements();
    _startCanvas();
  }

  function _applyElement() {
    containerWidth = mainContainer.getBoundingClientRect().width;
    containerHeight = mainContainer.getBoundingClientRect().height;
  }

  function _createElements() {
    scrollBarWidth = _getScrollBarWidth();
    canvasWidth = containerWidth - scrollBarWidth;
    canvasHeight = containerHeight - scrollBarWidth;
    scrollElementWidth = containerWidth - scrollBarWidth;
    scrollElementHeight = containerHeight - scrollBarWidth;
    cameraArea = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    drawArea = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };

    mainContainer.textContent = '';
    mainContainer.style.position = 'relative';

    componentCanvas = document.createElement('canvas');
    componentCanvas.width = canvasWidth;
    componentCanvas.height = canvasHeight;
    componentCanvas.style.position = 'absolute';
    componentCanvas.style.float = 'left';
    if (debug) componentCanvas.style.background = 'rosybrown';
    mainContainer.appendChild(componentCanvas);

    componentScrollV = document.createElement('div');
    componentScrollV.style.position = 'absolute';
    componentScrollV.style.right = '0px';
    componentScrollV.style.top = '0px';
    componentScrollV.style.height = `${scrollElementHeight}px`;
    componentScrollV.style['overflow-y'] = 'scroll';
    let componentScrollVSpacer = document.createElement('div');
    componentScrollVSpacer.style.width = '1px';
    componentScrollVSpacer.style.height = `${canvasDrawHeight}px`;
    componentScrollV.appendChild(componentScrollVSpacer);
    mainContainer.appendChild(componentScrollV);

    componentScrollH = document.createElement('div');
    componentScrollH.style.position = 'absolute';
    componentScrollH.style.left = '0px';
    componentScrollH.style.bottom = '0px';
    componentScrollH.style.width = `${scrollElementWidth}px`;
    componentScrollH.style['overflow-x'] = 'scroll';
    let componentScrollHSpacer = document.createElement('div');
    componentScrollHSpacer.style.height = '1px';
    componentScrollHSpacer.style.width = `${canvasDrawWidth}px`;
    componentScrollH.appendChild(componentScrollHSpacer);
    mainContainer.appendChild(componentScrollH);

    componentScrollS = document.createElement('div');
    componentScrollS.style.position = 'absolute';
    componentScrollS.style.right = '0px';
    componentScrollS.style.bottom = '0px';
    componentScrollS.style.background = '#dcdcdc';
    componentScrollS.style.width = `${scrollBarWidth}px`;
    componentScrollS.style.height = `${scrollBarWidth}px`;
    mainContainer.appendChild(componentScrollS);
  }

  function _startCanvas() {
    componentCanvas.context = componentCanvas.getContext('2d');
    componentCanvas.cameraArea = cameraArea;
    componentCanvas.drawArea = drawArea;
    componentCanvas.context.getCurrentOptionsOfCanvasContext = _getCurrentOptionsOfCanvasContext;
    componentCanvas.frameNo = 0;
    fatScrollY = componentCanvas.fatScrollY = canvasDrawHeight / canvasHeight;
    fatScrollX = componentCanvas.fatScrollX = canvasDrawWidth / canvasWidth;
    componentCanvas.clear = function() {componentCanvas.context.clearRect(0, 0, componentCanvas.width, componentCanvas.height);};
    componentCanvas.context.ICdrawRect = _ICdrawRect;
    componentCanvas.context.ICfillRect = _ICfillRect;
    _clearInterval();

    intervalID = componentCanvas.intervalID = setInterval(_draw, refreshRate);

    componentScrollH.addEventListener('scroll', _scrollHorizontal, false);
    componentScrollV.addEventListener('scroll', _scrollVertical, false);
    componentCanvas.addEventListener('wheel', _wheel, false);
    componentCanvas.addEventListener('mousemove', _mouseMove, false);
  }

  function _isInCameraArea(element) {
    if ((((element.x >= cameraArea.x) && (element.x <= cameraArea.x + cameraArea.width))
           || ((element.x + element.width >= cameraArea.x) && (element.x + element.width <= cameraArea.x + cameraArea.width)))
      && (((element.y >= cameraArea.y) && (element.y <= cameraArea.y + cameraArea.height))
           || ((element.y + element.height >= cameraArea.y) && (element.y + element.height <= cameraArea.y + cameraArea.height)))) {
      return true;
    }
    return false;
  }

  function _draw() {
    if (componentCanvas.cameraArea.x < 0) {
      componentCanvas.cameraArea.x = 0;
    }
    if (componentCanvas.cameraArea.y < 0) {
      componentCanvas.cameraArea.y = 0;
    }
    componentCanvas.context.strokeStyle = '#000';
    componentCanvas.context.lineWidth = 1;

    componentCanvas.context.fillStyle = '#FFF';
    componentCanvas.context.fillRect(componentCanvas.drawArea.x, componentCanvas.drawArea.y, componentCanvas.drawArea.width, componentCanvas.drawArea.height);

    if (onDraw(componentCanvas)) {
      let drawnElements = 0;
      elements.forEach(element => {
        const elementToDraw = Object.assign({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          type: 'none',
          contextOptions: {},
          elementOptions: {},
        }, element);

        if (_isInCameraArea(element)) {
          drawnElements += 1;
          const contextOptions = Object.assign({
            globalAlpha: 0.0,
            fillStyle: '#FFFFFF',
          }, elementToDraw.contextOptions);

          const elementOptions = Object.assign({
            translate: null,
            fixXY: null,
            drawAndFill: null,
            positionFixed: false,
          }, elementToDraw.elementOptions);

          switch (elementToDraw.type) {
            case 'draw':
              componentCanvas.context.ICdrawRect({
                x: elementToDraw.x,
                y: elementToDraw.y,
                w: elementToDraw.width,
                h: elementToDraw.height,
              }, contextOptions, elementOptions);
              break;
            case 'draw_and_fill':
              componentCanvas.context.ICfillRect({
                x: elementToDraw.x,
                y: elementToDraw.y,
                w: elementToDraw.width,
                h: elementToDraw.height,
              }, contextOptions, elementOptions);
              break;
            default:
              break;
          }
        }
      });
      // console.log(`Amount of drawn elements: ${drawnElements}/${elements.length}`);
    }

    componentCanvas.context.fillStyle = '#F5F5F5';
    componentCanvas.context.strokeStyle = '#fff';
  }

  function _wheel(e) {
    const scrollY = e.deltaY / 10;
    componentScrollV.scroll(0, componentScrollV.scrollTop + scrollY);
    componentCanvas.cameraArea.y = componentScrollV.scrollTop;
    return e;
  }

  function _scrollVertical(e) {
    componentCanvas.cameraArea.y = this.scrollTop;
    onScroll(this.scrollLeft, this.scrollTop);
    return e;
  }

  function _scrollHorizontal(e) {
    componentCanvas.cameraArea.x = this.scrollLeft;
    onScroll(this.scrollLeft, this.scrollTop);
    return e;
  }

  function _mouseMove(e) {
    let cursorType = 'default';
    elements.forEach((element) => {
      if ((e.offsetX >= element.x - cameraArea.x)
           && (e.offsetX <= element.x + element.width - cameraArea.x)
           && (e.offsetY >= element.y - cameraArea.y)
           && (e.offsetY <= element.y + element.height - cameraArea.y)) {
        cursorType = 'pointer';
      }
    });
    componentCanvas.style.cursor = cursorType;
  }

  function _getCurrentOptionsOfCanvasContext() {
    return {
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      strokeStyle: this.strokeStyle,
      fillStyle: this.fillStyle,
      font: this.font,
    };
  }

  function _clearInterval() {
    if (intervalID != null) {
      clearInterval(intervalID);
    }
  }

  function _ICdrawRect(area, optionsForContext = {}, optionsForComponent = {}) {
    const currentOptions = this.getCurrentOptionsOfCanvasContext();

    const settingsForApply = Object.assign({
      translate: null,
      fixXY: null,
      drawAndFill: null,
      positionFixed: false,
    }, optionsForComponent);

    const xToDraw = settingsForApply.positionFixed ? area.x : (area.x - cameraArea.x);
    const yToDraw = settingsForApply.positionFixed ? area.y : (area.y - cameraArea.y);

    Object.keys(optionsForContext).forEach((key) => {
      this[key] = optionsForContext[key];
    });
    if (settingsForApply.translate) {
      this.translate(settingsForApply.translate.x, settingsForApply.translate.y);
    }
    if (settingsForApply.fixXY) {
      if (settingsForApply.drawAndFill) {
        this.strokeRect(parseInt(xToDraw, 10) + settingsForApply.fixXY, parseInt(yToDraw, 10) + settingsForApply.fixXY, parseInt(area.w, 10) + settingsForApply.fixXY, parseInt(area.h, 10) + settingsForApply.fixXY);
        this.fillRect(parseInt(xToDraw, 10) + settingsForApply.fixXY, parseInt(yToDraw, 10) + settingsForApply.fixXY, parseInt(area.w, 10) + settingsForApply.fixXY, parseInt(area.h, 10) + settingsForApply.fixXY);
      } else {
        this.strokeRect(parseInt(xToDraw, 10) + settingsForApply.fixXY, parseInt(yToDraw, 10) + settingsForApply.fixXY, parseInt(area.w, 10) + settingsForApply.fixXY, parseInt(area.h, 10) + settingsForApply.fixXY);
      }
    } else if (settingsForApply.drawAndFill) {
      this.strokeRect(xToDraw, yToDraw, area.w, area.h);
      this.fillRect(xToDraw, yToDraw, area.w, area.h);
    } else {
      this.strokeRect(xToDraw, yToDraw, area.w, area.h);
    }
    Object.keys(currentOptions).forEach((key) => {
      this[key] = currentOptions[key];
    });
    if (settingsForApply.translate) {
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  function _ICfillRect(area, optionsForContext = {}, optionsForComponent = {}) {
    const currentOptions = this.getCurrentOptionsOfCanvasContext();

    const settingsForApply = Object.apply({
      translate: null,
      fixXY: null,
      drawAndFill: null,
      positionFixed: false,
    }, optionsForComponent);

    const xToDraw = settingsForApply.positionFixed ? area.x : (area.x - cameraArea.x);
    const yToDraw = settingsForApply.positionFixed ? area.y : (area.y - cameraArea.y);

    Object.keys(optionsForContext).forEach((key) => {
      this[key] = optionsForContext[key];
    });
    if (settingsForApply.translate) {
      this.translate(settingsForApply.translate.x, settingsForApply.translate.y);
    }
    if (settingsForApply.fixXY) {
      if (settingsForApply.drawAndFill) {
        this.strokeRect(parseInt(xToDraw, 10) + settingsForApply.fixXY, parseInt(yToDraw, 10) + settingsForApply.fixXY, parseInt(area.w, 10) + settingsForApply.fixXY, parseInt(area.h, 10) + settingsForApply.fixXY);
        this.fillRect(parseInt(xToDraw, 10) + settingsForApply.fixXY, parseInt(yToDraw, 10) + settingsForApply.fixXY, parseInt(area.w, 10) + settingsForApply.fixXY, parseInt(area.h, 10) + settingsForApply.fixXY);
      } else {
        this.fillRect(parseInt(xToDraw, 10) + settingsForApply.fixXY, parseInt(yToDraw, 10) + settingsForApply.fixXY, parseInt(area.w, 10) + settingsForApply.fixXY, parseInt(area.h, 10) + settingsForApply.fixXY);
      }
    } else if (settingsForApply.drawAndFill) {
      this.strokeRect(xToDraw, yToDraw, area.w, area.h);
      this.fillRect(xToDraw, yToDraw, area.w, area.h);
    } else {
      this.fillRect(xToDraw, yToDraw, area.w, area.h);
    }
    Object.keys(currentOptions).forEach((key) => {
      this[key] = currentOptions[key];
    });
    if (settingsForApply.translate) {
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  function _applyOptions(options) {
    const newOptions = Object.assign({
      debug: false,
      drawWidth: 0,
      drawHeight: 0,
      refreshRate: 100,
      onDraw: () => true,
      onScroll: () => true,
      onResize: () => true,
      onMouseMove: () => true,
      onMouseEnter: () => true,
      onMouseUp: () => true,
      onMouseDown: () => true,
      onClick: () => true,
      elements: [],
    }, options);

    debug = newOptions.debug;
    canvasDrawWidth = newOptions.drawWidth;
    canvasDrawHeight = newOptions.drawHeight;
    refreshRate = newOptions.refreshRate;
    onDraw = newOptions.onDraw;
    onScroll = newOptions.onScroll;

    onResize = newOptions.onResize;
    onMouseMove = newOptions.onMouseMove;
    onMouseEnter = newOptions.onMouseEnter;
    onMouseUp = newOptions.onMouseUp;
    onMouseDown = newOptions.onMouseDown;
    onClick = newOptions.onClick;

    elements = newOptions.elements;
  }

  function _elementIsDiv(element) {
    return element.tagName === 'DIV';
  }

  function _getScrollBarWidth() {
    const containerToMeasureWidth = document.createElement('div');
    containerToMeasureWidth.style.visibility = 'hidden';
    containerToMeasureWidth.style.width = '100px';
    containerToMeasureWidth.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(containerToMeasureWidth);
    const widthNoScroll = containerToMeasureWidth.offsetWidth;
    containerToMeasureWidth.style.overflow = 'scroll';
    const inner = document.createElement('div');
    inner.style.width = '100%';
    containerToMeasureWidth.appendChild(inner);
    const widthWithScroll = inner.offsetWidth;
    containerToMeasureWidth.parentNode.removeChild(containerToMeasureWidth);
    return widthNoScroll - widthWithScroll;
  }
}));
