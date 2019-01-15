## PTRScrollList 跨平台刷新组件

标签（空格分隔）： react-native ScrollView FlatList refresh

---

- [ ] **平台支持**
  - [x] iOS
  - [x] Android
- [ ] **功能特性**
  - [x] 支持下拉刷新、加载更多
  - [x] 支持刷新组件自定义
  - [x] 支持刷新组件的动态显示与隐藏
  - [x] 支持 conentsInset 属性（iOS）
- [ ] **组件扩展**
  - [x] ScrollList
  - [x] ListView
  - [x] FlatList
  - [x] VirtualizedList

_支持 ios&Android 平台_
<br>
![刷新动效](https://raw.githubusercontent.com/bird-xiong/PTRScrollList/master/res/11.gif)

#### JSX 属性

```
<PTRScrollList
            data={this.state.data}
            onHeaderRefreshing={this._onHeaderRefreshing}
            onFooterRefreshing={this._onFooterRefreshing}
            scrollComponent={"FlatList"}
            enableFooterInfinite={this.state.enableFooterInfinite}
            enableHeaderRefresh={this.state.enableHeaderRefresh}
            keyExtractor={this._keyExtractor}
            renderItem={({ item, index })=>this._renderRower(item, index)}
            ref={ref =>this.ptrScrollList = ref}/>
```

> `onHeaderRefreshing`
>
> ##### _头部开始刷新的回调方法_

> `onFooterRefreshing`
>
> ##### _底部刷新的回调方法_

> `scrollComponent`
>
> ##### _指定扩展的组件类型_

> `enableFooterInfinite`
>
> ##### _隐藏底部_

> `enableHeaderRefresh`
>
> ##### _隐藏头部_

> `renderFooterInfinite`
>
> ##### _自定义底部刷新_

> `renderHeaderRefresh`
>
> ##### _自定义头部刷新_

#### 组件配置

> TIMER_DELAY_REFRESH_SUCCESS

 刷新成功后顶部停留时间，默认 1 秒

> G_PULL_DOWN_DISTANCE

触发刷新的最大移动距离

#### API

1. 头部刷新成功
   > `this.ptrScrollList.ptr_headerRefreshFinished()`

##### _参数可缺省，传入 false 时可重置当前列表刷新状态（如果 falist 渲染开销大的话，在 setState 回调中调用有助于提升性能）_

2. 底部刷新成功
   > `this.ptrScrollList.ptr_footerRefershFinished()`

##### _参数可缺省，传入 false 时可隐藏底部刷新组件_

#### 自定义头部刷新

目前项目中自带一个刷新组件`HeaderComponent`，但是通常来说我们总是有定制化的需求，当前的刷新样式是使用 lottie 库生成的一个 json 文件，你可以去[这里](https://www.lottiefiles.com/tag/loading)找找有没有你喜欢的刷新样式
目前你有两种方式替换它

1. 重写`HeaderComponent`里面的样式
2. 使用`renderHeaderRefresh`属性覆盖它

这个时候，在你的自定义组件中需要实现一下几个方法

> `hc_refreshFinished = () => {...};`
>
> ##### _在刷新完成时被调用_

> `hc_startLoading = () => {...};`
>
> ##### _在开始刷新的时候被调用_

> `hc_updateProgress = per => {...};`
>
> ##### _在滑动的过程中被调用，per 为当前滑动距离的百分比_

> `hc_updateStatus = status => {...};`
>
> ##### _在列表状态变化的时候被调用，status 为刷新状态_

> `hc_resetStatus = () => {...};`
>
> ##### _刷新失败或者重置整个组件时被调用，这时候应该停止当前所有的动画并还原响应的状态_

当你的动画执行完成后，需要告诉 PTRScrolList

`this.props.ptrScrollFinished && this.props.ptrScrollFinished();`

#### 自定义底部刷新

底部组件跟头部组件一样，也有个内置的默认组件样式，你可以修改它或者通过`renderHeaderRefresh`覆盖它，通常情况下底部样式比较简单，只需要一点点文字

```
class FooterComponent extends Component {
  render() {
    return <Text style={[Styles.loadMoreFont]}>{"正在加载..."}</Text>;
  }
}
```

#### Android 的手势事件冲突

##### 下拉事件的处理在 Android 上面实现起来比 iOS 上困难的多，不仅仅是因为 Android 不支持 scrollview 的弹性效果，而是在用手势处理时，你会发现目前 RN 的线程模型无法处理原生控件的手势事件（scrollview）和自定义的手势事件之间的冲突，这个是一个框架上的瓶颈问题，据说在 RN 的重构版中会解决这类问题。<br>

##### 这个其实很好理解，事件在传递链中必须选择截获当前事件或者传递当前事件，当 scrollview 的手势事件和自定义的手势事件同时存在时，我们也希望能按这种标准处理，但是很显让因为 js 线程是异步的，scrollview 的手势不会等待底层视图的事件拦截器的处理结果，在 RN 的生态体系中，你会发现 scrollview 的事件总是优先级高的，并且你无法改变它。<br>

![传递链](https://raw.githubusercontent.com/bird-xiong/PTRScrollList/master/res/zenuml.png)

##### 所以在 PTRScrollList 中做一个比较取巧的方法，通过禁用 scrollview 的滚动来使得我们可以截获整个手势事件流，才能控制头部组件的下拉状态。<br>
