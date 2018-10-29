## PTRScrollList跨平台刷新组件

标签（空格分隔）： react-native ScrollView FlatList refresh

---

- [ ] **平台支持**
    - [x] iOS
    - [ ] Android
- [ ] **功能特性**
    - [x] 支持下拉刷新、加载更多
    - [x] 支持刷新组件自定义
    - [x] 支持刷新组件的动态显示与隐藏
    - [x] 支持conentsInset属性
- [ ] **组件扩展**
    - [x] ScrollList
    - [x] ListView
    - [x] FlatList
    - [x] VirtualizedList
    
*注：Android 的支持正在实现中*
<br>
![刷新动效](https://raw.githubusercontent.com/bird-xiong/PTRScrollList/master/11.gif)

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
>`onHeaderRefreshing`   
>##### *头部开始刷新的回调方法*

>`onFooterRefreshing`   
>##### *底部刷新的回调方法*

>`scrollComponent`      
>##### *指定扩展的组件类型*

>`enableFooterInfinite`
>##### *隐藏底部*

>`enableHeaderRefresh`  
>##### *隐藏头部*

>`renderFooterInfinite`  
>##### *自定义底部刷新*

>`renderHeaderRefresh`   
>##### *自定义头部刷新*

#### API
1. 头部刷新成功
> ```this.ptrScrollList.ptr_headerRefreshFinished()```
##### *参数可缺省，传入false时可重置当前列表刷新状态*

2. 底部刷新成功
> ```this.ptrScrollList.ptr_footerRefershFinished()```
##### *参数可缺省，传入false时可隐藏底部刷新组件*

#### 自定义头部刷新
目前项目中自带一个刷新组件```HeaderComponent```，但是通常来说我们总是有定制化的需求，当前的刷新样式是使用lottie库生成的一个json文件，你可以去[这里](https://www.lottiefiles.com/tag/loading)找找有没有你喜欢的刷新样式
目前你有两种方式替换它
1. 重写```HeaderComponent```里面的样式
2. 使用```renderHeaderRefresh```属性覆盖它

这个时候，在你的自定义组件中需要实现一下几个方法

>```hc_refreshFinished = () => {...};```
>##### *在刷新完成时被调用*

>```hc_startLoading = () => {...};```
>##### *在开始刷新的时候被调用*

>```hc_updateProgress = per => {...};```
>##### *在滑动的过程中被调用，per 为当前滑动距离的百分比*

>```hc_updateStatus = status => {...};```
>##### *在列表状态变化的时候被调用，status为刷新状态*

当你的动画执行完成后，需要告诉 PTRScrolList

```this.props.ptrScrollFinished && this.props.ptrScrollFinished();```

#### 自定义底部刷新
底部组件跟头部组件一样，也有个内置的默认组件样式，你可以修改它或者通过```renderHeaderRefresh```覆盖它，通常情况下底部样式比较简单，只需要一点点文字

```
class FooterComponent extends Component {
  render() {
    return <Text style={[Styles.loadMoreFont]}>{"正在加载..."}</Text>;
  }
}
```



    

