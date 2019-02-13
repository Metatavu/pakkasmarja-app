import React from "react";
import { Container, Content } from "native-base";
import { StyleSheet, View, ScrollView, Text, TouchableHighlight } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';

export interface Props {
 backgroundColor: string,
 displayFooter?: boolean
}

interface State {

}

export default class BasicLayout extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        backgroundColor: this.props.backgroundColor
      },
      footer: {
        height: 60,
        borderTopColor: "rgba(0,0,0,0.5)",
        borderTopWidth: 2,
        flex: 0,
        flexDirection: "row",
        alignItems: "center", 
        justifyContent: "space-around"
      }
    });
    return (
      <View style={{flex: 1}}>
        <ScrollView style={styles.container}>
          {this.props.children}
        </ScrollView>
        {this.props.displayFooter && 
          <View style={styles.footer}>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>Text</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>Text</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>Text</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>Text</Text>
              </View>
            </TouchableHighlight>
          </View>
        }
      </View>
    );
  }
}
