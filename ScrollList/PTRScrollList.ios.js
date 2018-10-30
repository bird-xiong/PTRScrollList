/**
 * Created by woowalker on 2017/8/28.
 */
"use strict";
import React, { Component } from "react";
import { View, StyleSheet, Dimensions, Text, Animated, ScrollView, ListView, FlatList, VirtualizedList } from "react-native";
import PropTypes from "prop-types";
import LottieView from "lottie-react-native";
const { width, height } = Dimensions.get("window");

const G_STATUS_NONE = 0, // 正常手势，没有上拉或者下拉刷新
  G_STATUS_PULLING_DOWN = 2, // ListView 处于顶部，下拉刷新
  G_STATUS_RELEASE_TO_REFRESH = 3, // 拉动距离处于可触发刷新或者加载状态
  G_STATUS_HEADER_REFRESHING = 4, // 顶部正在刷新
  G_STATUS_FOOTER_NONE = 5, //
  G_STATUS_FOOTER_REFRESHING = 6, // 底部正在加载更多
  G_PULL_DOWN_DISTANCE = 80; //下拉刷新下拉距离大于 80 时触发下拉刷新

class FooterComponent extends Component {
  render() {
    return <Text style={[Styles.loadMoreFont]}>{"正在加载..."}</Text>;
  }
}
class HeaderComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toFinished: false,
      progress: new Animated.Value(0),
      waitTimer: null,
      continuousRefresh: true,
      text: "下拉刷新"
    };
  }
  hc_refreshFinished = () => {
    this.state.toFinished = true;
  };
  hc_startLoading = () => {
    this.infiniteLoading();
  };
  hc_updateProgress = per => {
    this.state.progress.setValue(per);
  };
  hc_updateStatus = status => {
    let text = this.state.text;
    if (status === G_STATUS_NONE || status === G_STATUS_PULLING_DOWN) text = "下拉刷新";
    else if (status === G_STATUS_RELEASE_TO_REFRESH) text = "释放刷新";
    else text = "正在刷新";
    this.setState({ text });
  };
  shouldComponentUpdate(nextProps, nextState) {
    return nextState.text !== this.state.text
  }
  /** 展示加载动画 */
  infiniteLoading = () => {
    this.loading();
  };

  loading() {
    const { progress } = this.state;
    /** 执行动画时间 0.4 秒 */
    Animated.timing(this.state.progress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start(() => {
      if (!this.state.toFinished) {
        progress.setValue(0);
        this.loading();
      } else if (this.state.toFinished) {
        this.setState({
          text: '刷新成功'
        })
        this.state.toFinished = false;
        this.state.waitTimer = setTimeout(() => {
          this.state.continuousRefresh = true;
          this.props.ptrScrollFinished && this.props.ptrScrollFinished();
          clearInterval(this.state.waitTimer);
          this.state.waitTimer = null;
        }, 600);
      }
    });
  }
  render() {
    return (
      <View>
        <LottieView style={{ width: 80, height: 80 }} source={require("./progress_bar.json")} progress={this.state.progress}/>
        <Text style={{ position: "absolute", fontSize: 11, color: "#B8B8B8", left: 15, bottom: 20 }}>{this.state.text}</Text>
      </View>
    );
  }
}
const totalOffset = G_PULL_DOWN_DISTANCE;
class HeaderRefresh extends Component {
  _top = 0;
  _gestureStatus = G_STATUS_NONE;
  _currentOffset = 0;
  constructor(props) {
    super(props);
    this._top = props.contentInset ? props.contentInset.top : 0;
    props.getInstance instanceof Function && props.getInstance(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.contentInset && nextProps.contentInset.top !== this._top) {
      this._top = nextProps.contentInset.top;
      this._wrapRef.setNativeProps({ style: { top: this._top } });
    }
  }
  //通过ref向子组件传数据，避免整个scroll被渲染
  setRefreshStatus(status, offset) {
    let updateStyle = true;
    //刷新复位只更新状态
    if (status === G_STATUS_NONE && this._gestureStatus === G_STATUS_HEADER_REFRESHING) {
      updateStyle = false;
    } else if (status === G_STATUS_HEADER_REFRESHING && this._gestureStatus !== status) {
      this._lottieInstance.hc_startLoading && this._lottieInstance.hc_startLoading();
    } else if (status === G_STATUS_PULLING_DOWN || status === G_STATUS_RELEASE_TO_REFRESH) {
      if (offset >= 0) {
        let _per = offset / totalOffset;
        this._lottieInstance.hc_updateProgress && this._lottieInstance.hc_updateProgress(_per);
      }
    }
    this._lottieInstance.hc_updateStatus && this._lottieInstance.hc_updateStatus(status);
    this._gestureStatus = status;
    if (offset >= 0) {
      offset = Math.min(G_PULL_DOWN_DISTANCE, offset);
    }
    let opacity = 1;
    let translateY = offset - G_PULL_DOWN_DISTANCE;
    if (status === G_STATUS_PULLING_DOWN || status === G_STATUS_NONE) {
      opacity = Math.min(offset, 10) / 10;
    }
    updateStyle && this._wrapRef.setNativeProps({ style: { transform: [{ translateY }], opacity } });
  }

  render() {
    let Header = this.props.renderHeaderRefresh ? this.props.renderHeaderRefresh : HeaderComponent;
    return (
      <View
        ref={ref => (this._wrapRef = ref)}
        style={[
          Styles.refresh,
          {
            transform: [{ translateY: -G_PULL_DOWN_DISTANCE }],
            top: this._top,
            opacity: 0
          }
        ]}
      >
        <Header ref={ins => (this._lottieInstance = ins)} ptrScrollFinished={this.props.ptrScrollFinished} />
      </View>
    );
  }
}

export default class PTRScrollList extends Component {
  _headerRefreshInstance = null; //刷新头实例
  _currentOffsetY = 0;
  _currentContentSizeHeight = 0;
  _footerMoreData = true;
  _ptrHeight = 1;
  _originContentInset = null;

  static propTypes = {
    scrollComponent: PropTypes.oneOf(["ScrollView", "ListView", "FlatList", "VirtualizedList"]).isRequired,
    getRef: PropTypes.func,
    onHeaderRefreshing: PropTypes.func,
    onFooterRefreshing: PropTypes.func,
    renderFooterInfinite: PropTypes.object,
    renderHeaderRefresh: PropTypes.object
  };

  static defaultProps = {
    scrollComponent: "FlatList",
    onHeaderRefreshing: () => null,
    onFooterRefreshing: () => null
  };

  constructor(props) {
    super(props);
    this.state = {
      gestureStatus: G_STATUS_NONE,
      enableFooterInfinite: false || props.enableFooterInfinite,
      enableHeaderRefresh: props.enableHeaderRefresh == undefined ? true : props.enableHeaderRefresh,
      footerStatus: G_STATUS_FOOTER_NONE,
      contentInset: props.contentInset ? props.contentInset : { top: 0, right: 0, bottom: 0, left: 0 }
    };
    this._originContentInset = props.contentInset ? props.contentInset : this.state.contentInset;
    props.getInstance instanceof Function && props.getInstance(this);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.enableHeaderRefresh !== undefined) this.state.enableHeaderRefresh = nextProps.enableHeaderRefresh;

    if (nextProps.enableFooterInfinite !== undefined) this.state.enableFooterInfinite = nextProps.enableFooterInfinite;

    if (nextProps.contentInset) {
      this.state.contentInset = { ...nextProps.contentInset, top: this.state.contentInset.top - this._originContentInset.top + nextProps.contentInset.top };
      this._originContentInset = nextProps.contentInset;
    }
  }
  // 动画刷新完成初始化位置
  _headerRefreshDone = (animated = true) => {
    this._setGestureStatus(G_STATUS_NONE);
    this._headerRefreshInstance.setRefreshStatus(G_STATUS_NONE, -this._originContentInset.top);
    this.setState({
      contentInset: this._originContentInset
    });
    this._currentOffsetY < 0 && this._scrollToPos(-this._originContentInset.top, animated);
    this._footerMoreData = true;
    this._updateFooterVisible();
  };
  // 刷新结束
  ptr_headerRefreshFinished = (animated = true) => {
    if (animated == false) this._headerRefreshDone(animated);
    else this._headerRefreshInstance._lottieInstance.hc_refreshFinished && this._headerRefreshInstance._lottieInstance.hc_refreshFinished();
  };
  ptr_footerRefershFinished = moreData => {
    this.state.footerStatus = G_STATUS_FOOTER_NONE;
    this._footerMoreData = moreData || false;
    this._updateFooterVisible();
  };

  /**  根据状态来判断需要执行的 刷新事件类型 */
  _setGestureStatus = status => {
    this.state.gestureStatus = status;
    if (status === G_STATUS_HEADER_REFRESHING) {
      this.props.onHeaderRefreshing && this.props.onHeaderRefreshing();
    }
  };

  _scrollToPos = (offset, animated) => {
    let { scrollComponent } = this.props;
    switch (scrollComponent) {
      case "ScrollView":
      case "ListView":
        this._scrollInstance.scrollTo({ x: 0, y: offset, animated });
        break;
      case "FlatList":
      case "VirtualizedList":
        this._scrollInstance.scrollToOffset({ offset, animated });
        break;
    }
  };
  /**
   * 页面滚动函数，根据页面的滚动 距离，执行相对应的方法
   */
  onScroll = e => {
    let { contentOffset, contentInset } = e.nativeEvent;
    this._currentOffsetY = contentOffset.y;
    let { enableHeaderRefresh, gestureStatus } = this.state;
    if (enableHeaderRefresh) {
      let y = this._currentOffsetY * -1 - this._originContentInset.top;
      if (gestureStatus !== G_STATUS_HEADER_REFRESHING && gestureStatus !== G_STATUS_RELEASE_TO_REFRESH) {
        if (y >= G_PULL_DOWN_DISTANCE) this._setGestureStatus(G_STATUS_RELEASE_TO_REFRESH);
        else this._setGestureStatus(G_STATUS_PULLING_DOWN);
      }
      this._headerRefreshInstance.setRefreshStatus(this.state.gestureStatus, y);
    }
  };

  // 拖拽结束
  onScrollEndDrag = e => {
    let { enableHeaderRefresh } = this.state;
    let { gestureStatus, footerStatus } = this.state;
    let { contentOffset, contentInset } = e.nativeEvent;
    let y = contentOffset.y;
    if (this.state.enableHeaderRefresh) {
      y = y * -1 - this._originContentInset.top;
      if (gestureStatus !== G_STATUS_HEADER_REFRESHING && footerStatus === G_STATUS_FOOTER_NONE) {
        if (y >= G_PULL_DOWN_DISTANCE) {
          this._setGestureStatus(G_STATUS_HEADER_REFRESHING);
          this._scrollToPos(-G_PULL_DOWN_DISTANCE - this._originContentInset.top, true);
          this.setState({
            contentInset: {
              ...this._originContentInset,
              top: this._originContentInset.top + G_PULL_DOWN_DISTANCE
            }
          });
        }
      }
      this._headerRefreshInstance.setRefreshStatus(this.state.gestureStatus, y);
    }
    this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
  };
  onContentSizeChange = (w, h) => {
    this._currentContentSizeHeight = h;
    this._updateFooterVisible();
    this.props.onContentSizeChange && this.props.onContentSizeChange(w, h);
  };
  onLayout = e => {
    this._ptrHeight = e.nativeEvent.layout.height;
    this._updateFooterVisible();
    this.props.onLayout && this.props.onLayout(e);
  };

  onEndReachedCalledDuringMomentum = true;
  // 视图滚动开始
  onMomentumScrollBegin = e => {
    // this.onEndReachedCalledDuringMomentum = false;
    this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
  };
  onScrollBeginDrag = e => {
    this.onEndReachedCalledDuringMomentum = false;
    this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
  }
  onEndReached = () => {
    if (!this.onEndReachedCalledDuringMomentum) {
      let { enableFooterInfinite, gestureStatus } = this.state;
      if (enableFooterInfinite && gestureStatus !== G_STATUS_HEADER_REFRESHING && this._footerVisible()) {
        this.props.onFooterRefreshing();
        this.state.footerStatus = G_STATUS_FOOTER_REFRESHING;
      }
      this.onEndReachedCalledDuringMomentum = true;
    }
    this.props.onEndReached && this.props.onEndReached();
  };

  _renderFooterInfinite = () => {
    let Footer = this.props.renderFooterInfinite ? this.props.renderFooterInfinite : FooterComponent;
    return (
      <View ref={ref => (this._footerRef = ref)} style={[Styles.endLoadMore, { display: this._footerVisible() ? "flex" : "none" }]}>
        <Footer />
      </View>
    );
  };
  //两种情况底部不可见 1、不满一屏 2、没有更多数据
  _footerVisible = () => {
    return this._currentContentSizeHeight >= this._ptrHeight && this._footerMoreData;
  };
  _updateFooterVisible = () => {
    this._footerRef && this._footerRef.setNativeProps({ style: { display: this._footerVisible() ? "flex" : "none" } });
  };
  render() {
    let { enableFooterInfinite, enableHeaderRefresh } = this.state;
    let { scrollComponent } = this.props;
    let ScrollComponent = null;
    switch (scrollComponent) {
      case "ScrollView":
        ScrollComponent = <ScrollView {...this.props} />;
        break;
      case "ListView":
        ScrollComponent = <ListView {...this.props} />;
        break;
      case "FlatList":
        ScrollComponent = <FlatList {...this.props} onEndReached={this.onEndReached} />;
        break;
      case "VirtualizedList":
        ScrollComponent = <VirtualizedList {...this.props} />;
        break;
      default:
        ScrollComponent = <FlatList {...this.props} onEndReached={this.onEndReached} />;
        break;
    }
    return (
      <View style={Styles.wrap}>
        {enableHeaderRefresh ? (
          <HeaderRefresh
            getInstance={ins => (this._headerRefreshInstance = ins)}
            contentInset={this.props.contentInset}
            ptrScrollFinished={this._headerRefreshDone}
            renderHeaderRefresh={this.props.renderHeaderRefresh}
          />
        ) : null}
        {React.cloneElement(
          ScrollComponent,
          {
            ref: ref => {
              this._scrollInstance = ref;
              this.props.getRef instanceof Function && this.props.getRef(ref);
            },
            scrollEventThrottle: this.props.scrollEventThrottle || 16,
            contentContainerStyle: this.props.contentContainerStyle || { backgroundColor: "#ffffff" },
            onTouchStart: this.onTouchStart,
            onTouchMove: this.onTouchMove,
            onScroll: this.onScroll,
            onLayout: this.onLayout,
            onContentSizeChange: this.onContentSizeChange,
            contentInset: this.state.contentInset,
            onScrollBeginDrag:this.onScrollBeginDrag,
            onScrollEndDrag: this.onScrollEndDrag,
            onMomentumScrollBegin: this.onMomentumScrollBegin,
            onMomentumScrollEnd: this.onMomentumScrollEnd,
            onEndReachedThreshold: 0.01,
            ListFooterComponent: enableFooterInfinite ? this._renderFooterInfinite() : null,
            automaticallyAdjustContentInsets: false
          },
          this.props.children
        )}
      </View>
    );
  }
}

const Styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: "hidden"
  },
  refresh: {
    position: "absolute",
    top: 0,
    right: 0,
    height: G_PULL_DOWN_DISTANCE,
    left: 0,
    zIndex: 10000,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end"
  },

  endLoadMore: {
    width,
    backgroundColor: "#f7f7f7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },

  loadMoreFont: {
    fontSize: 12,
    height: 30,
    lineHeight: 30,
    color: "#B8B8B8"
  }
});
