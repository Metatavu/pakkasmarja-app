import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Delivery } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { styles } from "./styles.tsx";
import { Text } from 'react-native';
import { Icon } from "native-base";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  loading: boolean;

  deliveryListTestData: Delivery[];
};

/**
 * Incoming deliveries component class
 */
class IncomingDeliveriesScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,

      deliveryListTestData: [{
        id: "1",
        productId: "2",
        userId: "3",
        status: "PROPOSAL",
        amount: 1000,
        price: "3000",
        quality: "NORMAL"
      }, {
        id: "2",
        productId: "2",
        userId: "3",
        status: "PLANNED",
        amount: 1000,
        price: "3000",
        quality: "NORMAL"
      }, {
        id: "3",
        productId: "2",
        userId: "3",
        status: "DELIVERY",
        amount: 1000,
        price: "3000",
        quality: "NORMAL"
      }, {
        id: "4",
        productId: "2",
        userId: "3",
        status: "DONE",
        amount: 1000,
        price: "3000",
        quality: "NORMAL"
      }, {
        id: "5",
        productId: "2",
        userId: "3",
        status: "REJECTED",
        amount: 1000,
        price: "3000",
        quality: "NORMAL"
      }]
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <Text style={{ color: "black", fontWeight: '700', fontSize: 18, marginTop: 30 }}><Icon type="MaterialCommunityIcons" name="truck-delivery" style={styles.red} />Tulevat toimitukset</Text>
            <TouchableOpacity style={[styles.deliveriesButton, { width: "60%", height: 50, marginVertical: 30 }]} onPress={() => { this.props.navigation.navigate("NewDelivery") }}>
              <Text style={styles.buttonText}>Uusi toimitus</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {
              this.state.deliveryListTestData.map((delivery) => {
                return this.renderListItems(delivery)
              })
            }
          </View>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Renders list items
   */
  private renderListItems = (delivery: Delivery) => {

    // Pitää hake product name ID avulla

    const placeholder = 'Ennen klo 11';
    const placeholder2 = 'Mansikkaa 250 G x 8';

    if (delivery.status !== "REJECTED") {
      return (
        <View key={delivery.id} style={styles.renderCustomListItem}>
          <View style={{ flex: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'black' }}>{placeholder}</Text>
              <Text style={{ color: 'black', fontWeight: 'bold' }}>{placeholder2}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {this.renderStatus(delivery)}
          </View>
        </View>
      );
    }
  }

  /**
   * Renders elements depending on delivery status
   */
  private renderStatus = (delivery: Delivery) => {
    const status = delivery.status;
    if (status === "PROPOSAL") {
      return (
        <View style={styles.center}>
          <Text>Tarkistuksessa</Text>
        </View>);
    }
    else if (status === "DELIVERY") {
      return (
        <View style={styles.center}>
          <Text style={styles.green}>Toimituksessa</Text>
        </View>);
    }
    else if (status === "PLANNED") {
      return (
        <View style={styles.center}>
          <TouchableOpacity
            style={[styles.begindeliveryButton, styles.center, { width: "100%", height: 40 }]}
            onPress={() => { this.props.navigation.navigate("Delivery", { delivery: delivery, editable: true }) }}>
            <Text style={styles.buttonText}>Aloita toimitus</Text>
          </TouchableOpacity>
        </View>
      );
    }
    else if (status === "DONE") {
      return (
        <View style={styles.center}>
          <Text style={styles.red}>Hyväksytty</Text>
        </View>);
    }
  }
}

/**
 * Redux mapper for mapping store state to component props
 * 
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken
  };
}

/**
 * Redux mapper for mapping component dispatches 
 * 
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(IncomingDeliveriesScreen);
