import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail } from "native-base";
import { TouchableOpacity, Image, View, Text } from "react-native";
import { List, ListItem } from 'react-native-elements';
import { styles } from './styles.tsx'
import { PREDICTIONS_ICON, RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO } from "../../../static/images";

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
};

/**
 * Component state
 */
interface State {
  loading: boolean
};

/**
 * Deliveries screen component class
 */
export default class DeliveriesScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * On delivery item click
   * 
   * @param screen screen
   * @param type type
   */
  private onDeliveryItemClick = (screen: string, type: string) => {
    console.log("TPYE:" + type);
    this.props.navigation.navigate(screen, {
      type: type
    });
  }

  /**
   * Render icon
   * 
   * @param src icon source
   */
  private renderIcon = (src: any) => {
    return (
      <Thumbnail 
        square 
        style={{ maxHeight: "100%", maxWidth: "100%" }} 
        source={src} 
      />
    );
  }

  /**
   * Render list item
   */
  renderDeliveryList = (deliveryList: any, productType: string) => {
    return (
      <View style={{flex: 1, flexDirection: "column"}}>
        {
          deliveryList.map((listItem: any) => {
            return (
              <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, productType) }}>
              <View key={listItem.screen} style={{width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 35}}> 
                <View style={{width: 40, alignContent: "center", alignItems: "center", paddingLeft: 5, paddingRight: 5}}>
                  <Image
                    style={{flex: 1, width: 40, resizeMode: 'contain'}}
                    source={listItem.icon}
                  />
                </View>
                <View style={{width: 300, paddingLeft: 20, flex: 1, justifyContent: 'center'}}>
                  <Text style={{fontWeight: "bold", color: "#000000", fontSize: 20}}>
                    {listItem.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            );
          })
        }
      </View>
    );
    }

  /**
   * Render method
   */
  public render() {
    const deliveryList = [{
      name: "Ehdotukset",
      icon: RED_LOGO,
      screen: "Proposals"
    }, {
      name: "Viikkoennusteet",
      icon: PREDICTIONS_ICON,
      screen: "WeekDeliveryPrediction"
    }, {
      name: "Tulevat toimitukset",
      icon: INCOMING_DELIVERIES_LOGO,
      screen: "IncomingDeliveries"
    }, {
      name: "Tehdyt toimitukset",
      icon: COMPLETED_DELIVERIES_LOGO,
      screen: "PastDeliveries"
    }];

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <Tabs>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"TUORETUOTTEET"}>
            {
              this.renderDeliveryList(deliveryList, "FRESH")
            }
          </Tab>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"PAKASTEET"}>
            {
              this.renderDeliveryList(deliveryList, "FROZEN")
            }
          </Tab>
        </Tabs>
      </BasicScrollLayout>
    );
  }
}