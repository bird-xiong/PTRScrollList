/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */
import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, Dimensions, NativeModules } from "react-native";
import PTRScrollList from "./ScrollList/PTRScrollList";
const { width, height } = Dimensions.get("window"); //屏幕宽度
export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this._generateData(0),
      enableHeaderRefresh: true,
      enableFooterInfinite: true
    };
    this._page = 0;
  }
  _onHeaderRefreshing = () => {
    this._page = 0;
    console.log("_onHeaderRefreshing");
    setTimeout(() => {
      this.setState(
        {
          data: this._generateData(0)
          // enableFooterInfinite: false
        },
        () => this.ptrScrollList.ptr_headerRefreshFinished()
      );
    }, 2000);
  };
  _onFooterRefreshing = () => {
    this._page = this._page + 1;
    console.log("_onFooterRefreshing");
    setTimeout(() => {
      let more = this.state.data.concat(this._generateData(this._page * 20));
      this.setState(
        {
          data: more
          // enableHeaderRefresh: false
        },
        () => this.ptrScrollList.ptr_footerRefershFinished(true)
      );
    }, 2000);
  };
  _generateData = index => {
    let d = [];
    for (let i = index; i < index + 20; i++) {
      d.push(i);
    }
    return d;
  };
  _renderRower = (item, index) => {
    return (
      <Text
        onPress={() => index == 1 && NativeModules.DevHelper && NativeModules.DevHelper.reload()}
        key={index}
        style={{ color: "black", backgroundColor: "transparent", width, height: 60 }}
      >
        {item}
      </Text>
    );
  };
  _keyExtractor = (item, index) => index.toString();
  render() {
    return (
      <View style={styles.container}>
        <PTRScrollList
          data={this.state.data}
          onHeaderRefreshing={this._onHeaderRefreshing}
          onFooterRefreshing={this._onFooterRefreshing}
          scrollComponent={"FlatList"}
          showsVerticalScrollIndicator={false}
          keyExtractor={this._keyExtractor}
          enableFooterInfinite={this.state.enableFooterInfinite}
          enableHeaderRefresh={this.state.enableHeaderRefresh}
          ref={ref => {
            this.ptrScrollList = ref;
          }}
          renderItem={({ item, index }) => this._renderRower(item, index)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  }
});
