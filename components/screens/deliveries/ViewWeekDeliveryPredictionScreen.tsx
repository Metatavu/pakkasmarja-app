import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, WeekDeliveryPredictionTableData } from "../../../types";
import * as actions from "../../../actions";
import { View, Text, TouchableOpacity, TouchableHighlight, Dimensions } from "react-native";
import { styles } from "./styles.tsx";
import NumericInput from 'react-native-numeric-input';
import moment from "moment";
import 'moment/min/locales';
import Icon from "react-native-vector-icons/Feather";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Component props
 */
interface Props {
  navigation: any;
  route: any;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  averageDailyAmount: number;
  predictionData?: WeekDeliveryPredictionTableData;
};

/**
 * View week delivery prediction component class
 */
class ViewWeekDeliveryPredictionScreen extends React.Component<Props, State> {

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      averageDailyAmount: 0
    };
  }

  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerTitle: () => <TopBar navigation={navigation}
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft: () =>
        <TouchableHighlight onPress={() => { navigation.goBack(null) }} >
          <Icon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
    }
  };

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { route } = this.props;
    this.props.navigation.setOptions(this.navigationOptions(this.props.navigation));
    if (!this.props.accessToken) {
      return;
    }
    const predictionData: WeekDeliveryPredictionTableData = await route.params.predictionData;
    const averageDailyAmount: number = Math.round(predictionData.weekDeliveryPrediction.amount / 7);
    this.setState({ predictionData: predictionData, averageDailyAmount: averageDailyAmount });
  }

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.center}>
          <Text style={{ fontWeight: "bold", fontSize: 24, color: "black", padding: 20 }}>{this.state.predictionData ? this.state.predictionData.itemGroup.displayName : null}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.center, styles.lightRedBackGroundColor, { paddingVertical: 10 }]}>
            <TouchableOpacity onPress={() => this.props.navigation.navigate("ViewAllDeliveries")}>
              <Text style={styles.red}>Katso kaikki toimitukset</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 2, borderBottomColor: "black", borderBottomWidth: 0.7, paddingVertical: 20 }}>
          <View style={[styles.center, { paddingBottom: 20 }]}>
            <Text style={{ fontSize: 24, color: "black", fontWeight: "500" }}>Ennuste viikolle {this.state.predictionData ? this.state.predictionData.weekDeliveryPrediction.weekNumber : null} (KG)</Text>
          </View>
          <View style={styles.center}>
            <View style={[styles.center, { width: "90%", height: 70, borderRadius: 7, borderColor: "#B4B4B4", borderWidth: 1.25, marginBottom: 10 }]}>
              <NumericInput
                initValue={this.state.predictionData ? this.state.predictionData.weekDeliveryPrediction.amount : 0}
                onChange={() => { }}
                totalWidth={Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20}
                totalHeight={50}
                editable={false}
                iconSize={35}
                step={0}
                valueType='real'
                minValue={0}
                textColor='black'
                rightButtonBackgroundColor='#B4B4B4'
                leftButtonBackgroundColor='#B4B4B4'
                borderColor='transparent'
                rounded
              />
            </View>
          </View>
          <View style={styles.center}>
            <Text style={styles.textPrediction}>Keskimäärin<Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.averageDailyAmount} kg/pv`}</Text></Text>
          </View>
        </View>
        <View style={[styles.center, { paddingVertical: 20 }]}>
          <Text style={{ fontSize: 22, color: "black", fontWeight: "500" }}>Minä päivinä toimitat?</Text>
          <View style={[styles.center, { paddingVertical: 20 }]}>
            {
              Object.entries(this.state.predictionData ? this.state.predictionData.weekDeliveryPrediction.days : {}).map((key, index) => {
                return this.RadioButton(key.slice()[1], index);
              })
            }
          </View>
        </View>
        <View style={styles.center}>
          <TouchableOpacity style={[styles.deliveriesButton, { width: "70%", height: 60, marginTop: 10, marginBottom: 20 }]} onPress={() => { this.props.navigation.navigate("WeekDeliveryPrediction") }}>
            <Text style={styles.buttonText}>Takaisin</Text>
          </TouchableOpacity>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Renders one radio button
   */
  private RadioButton = (selected: boolean, index: number) => {
    moment.locale('fi');
    let displayName = moment().isoWeekday(index + 1).format("dddd");
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    return (
      <View key={index} style={{ flex: 1, flexDirection: "row", marginVertical: 5 }}>
        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingVertical: 5 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.radioButtonContainer}>
              {
                selected ? <View style={styles.radioButtonSelected} /> : null
              }
            </View>
          </View>
        </View>
        <View style={{ flex: 1.5, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={[styles.textPrediction, { paddingLeft: 15, paddingVertical: 5 }]}>
            {displayName}
          </Text>
        </View>
      </View>
    );
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewWeekDeliveryPredictionScreen);
