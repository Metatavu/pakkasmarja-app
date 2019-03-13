import React from "react";
import BasicLayout from "../layout/BasicLayout";
import TopBar from "../layout/TopBar";
import { Text } from "native-base";
import { View } from "react-native";

export interface Props {
  navigation: any
};

interface State {
};

export default class MainScreen extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  static navigationOptions = {
    headerTitle: <TopBar 
      showMenu={true} 
      showHeader={false} 
      showUser={true} 
      secondaryNavItems={[{
        "text": "Secondary 1", 
        "link": "/secondary"
      },{
        "text": "Secondary 2", 
        "link": "/secondary"
      },{
        "text": "Secondary 3", 
        "link": "/secondary"
      }]}
    />
  };

  componentDidMount() {
    this.props.navigation.addListener("willFocus", () => console.log("asd"));
    this.props.navigation.addListener("willBlur", () => console.log("qqq"));
  }

  render() {
    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
        <Text style={{fontSize: 30}}>Main scroll view</Text>
      </BasicLayout>
    );
  }
}
