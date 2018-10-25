/**
 * Created by bird-mac on 2018/7/9.
 */
import React, { Component } from "react";
import PropTypes from "prop-types";
import Util from "../../utility/util";
import HBStyle from "../../styles/standard";

import PTRScrollList from "./PTRScrollList";
import withOnScroll from "../HOC/withOnScrollToNav";

const WithOnScroll = withOnScroll(PTRScrollList);

import { StyleSheet, View, Image, TouchableHighlight, Text, ListView, Platform, BackHandler, FlatList } from "react-native";
import withTemplate from "../HOC/withTemplate";
import Size from '../../utility/size'
@withTemplate
export default class RefreshTest extends Component {
  constructor(props) {
    super(props);
    this.navConfig = {
      title: "债转专区"
    };
    this.state = {
        data: this._generateData(0),
        enableHeaderRefresh: true,
        enableFooterInfinite: true
    }
    this._page = 0
  }
  componentDidMount() {
  
  }

  componentWillUnmount() {
  }
  _onHeaderRefreshing = () =>{
      this._page = 0
    console.log('_onHeaderRefreshing')
    setTimeout(() => {
        this.setState({
            data: this._generateData(0),
            // enableFooterInfinite: true
        })
        this.ptrScrollList.ptr_headerRefreshFinished()
      }, 2000)
  }
  _onFooterRefreshing = () =>{
    this._page = this._page + 1
      console.log('_onFooterRefreshing')
    setTimeout(() => {
        let more = this.state.data.concat(this._generateData(this._page*20))
        this.setState({
            data: more,
            // enableHeaderRefresh: false
        })
        this.ptrScrollList.ptr_footerRefershFinished(true)
      }, 2000)
  }
  _generateData = (index) =>{
      let d = []
      for (let i=index;i<index+20;i++){
          d.push(i)
      }
      return d
  }
  _renderRower = (item, index) => {
    return <Text key={index} style={{color: 'black', backgroundColor:'transparent',width: Size.screen.width, height: 60}}>{item}</Text>;
  };
  _keyExtractor = (item, index) => index.toString();
  render() {
    return (
      <View style={Styles.wrap}>
          <PTRScrollList
            renderHeaderRefresh={()=>null}
            data={this.state.data}
            onHeaderRefreshing={this._onHeaderRefreshing}
            onFooterRefreshing={this._onFooterRefreshing}
            scrollComponent={"FlatList"}
            showsVerticalScrollIndicator={false}
            keyExtractor={this._keyExtractor}
            enableFooterInfinite={this.state.enableFooterInfinite}
            enableHeaderRefresh={this.state.enableHeaderRefresh}
            contentInset = {{top: 50}}
            ref={ref => {
              this.ptrScrollList = ref;
            }}
            renderItem={({ item, index }) => this._renderRower(item, index)}
          />
      </View>
    );
  }
}
const Styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: HBStyle.color.gray_bg,
    ...HBStyle.layout.cfsc
  }
});
