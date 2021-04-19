import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, WeekDay } from "../../../types";
import * as actions from "../../../actions";
import { View, Text, TouchableOpacity, TouchableHighlight, Dimensions } from "react-native";
import { styles } from "./styles.tsx";
import { WeekDeliveryPrediction, ItemGroup, WeekDeliveryPredictionDays } from "pakkasmarja-client";
import { Icon } from "native-base";
import NumericInput from 'react-native-numeric-input';
import moment from "moment";
import PakkasmarjaApi from "../../../api";
import FeatherIcon from "react-native-vector-icons/Feather";
import * as _ from "lodash";
import AsyncButton from "../../generic/async-button";

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
  itemGroups: ItemGroup[];
  selectedItemGroup: ItemGroup;
  itemGroupIndex: number;
  amount: number;
  weekDays: WeekDay[];
  lastWeeksDeliveryPredictionTotalAmount: number;
  averageDailyAmount: number;
  percentageAmount: string;
};

/**
 * New week delivery prediction component class
 */
class NewWeekDeliveryPrediction extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      itemGroups: [],
      lastWeeksDeliveryPredictionTotalAmount: 0,
      itemGroupIndex: 0,
      averageDailyAmount: 0,
      percentageAmount: "0",
      amount: 0,
      selectedItemGroup: {},
      weekDays: [
        { name: "monday", displayName: "Maanantai", value: false },
        { name: "tuesday", displayName: "Tiistai", value: false },
        { name: "wednesday", displayName: "Keskiviikko", value: false },
        { name: "thursday", displayName: "Torstai", value: false },
        { name: "friday", displayName: "Perjantai", value: false },
        { name: "saturday", displayName: "Lauantai", value: false },
        { name: "sunday", displayName: "Sunnuntai", value: false },
      ]
    };
  }

  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar navigation={navigation}
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft:
        <TouchableHighlight onPress={() => { navigation.goBack(null) }} >
          <FeatherIcon
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
    if (!this.props.accessToken) {
      return;
    }

    await this.setLastWeeksTotal();
    const itemGroups: ItemGroup[] = this.props.navigation.getParam('itemGroups');
    this.setState({ itemGroups: itemGroups, selectedItemGroup: itemGroups[0] });
  }

  /**
   * Renders one radio button
   * 
   * @param selected selected
   * @param label label
   * @param index index
   */
  private renderRadioButton = (selected: boolean, label: string, index: number) => {
    return (
      <View key={label} style={{ flex: 1, flexDirection: "row", marginVertical: 5 }}>
        <TouchableOpacity style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingVertical: 5 }} onPress={() => {
          this.changeWeekDayValue(selected, index);
        }}>
          <View style={{ flex: 1 }}>
            <View style={styles.radioButtonContainer}>
              {
                selected ? <View style={styles.radioButtonSelected} /> : null
              }
            </View>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1.5, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={[styles.textPrediction, { paddingLeft: 15, paddingVertical: 5 }]}>
            {label}
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Sends new week delivery prediction
   */
  private createNewWeekDeliveryPrediction = async () => {
    if (!this.props.accessToken || !this.state.selectedItemGroup.id) {
      return;
    }

    const weekDeliveryPredictionDays: WeekDeliveryPredictionDays = {};

    this.state.weekDays.forEach((day: WeekDay) => {
      weekDeliveryPredictionDays[day.name] = day.value;
    });

    const weekDeliveryPrediction: WeekDeliveryPrediction = {
      itemGroupId: this.state.selectedItemGroup.id,
      userId: this.props.accessToken.userId,
      amount: this.state.amount,
      weekNumber: Number(moment().format("W")),
      year: this.getYear(),
      days: weekDeliveryPredictionDays
    }

    const Api = new PakkasmarjaApi();
    const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
    await weekDeliveryPredictionService.createWeekDeliveryPrediction(weekDeliveryPrediction);

    this.props.navigation.navigate("Deliveries");
  }

  /**
   * Handle value change
   * 
   * @param value value
   */
  private handleValueChange = (value: number) => {
    const averageDailyAmount: number = Math.round(value / 7);
    this.calculatePercentage(value);
    this.setState({ amount: value, averageDailyAmount: averageDailyAmount });
  }

  /**
   * Calculate percentage
   */
  private calculatePercentage = (inputValue?: number) => {
    const value = inputValue || this.state.amount;
    let percentageAmount: string = "0";
    const lastWeeksAmount = this.state.lastWeeksDeliveryPredictionTotalAmount > 0 ? this.state.lastWeeksDeliveryPredictionTotalAmount : 1;
    if (value > 0) {
      lastWeeksAmount === 1 ? percentageAmount = value.toFixed(2) : percentageAmount = ((value / lastWeeksAmount) * 100 - 100).toFixed(2);
    }
    this.setState({ percentageAmount });
  }

  /**
   * Set last weeks total to state
   */
  private setLastWeeksTotal = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const lastWeekNumber: number = moment().subtract(1, "weeks").week();
    const Api = new PakkasmarjaApi();
    const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
    const year = moment().year();
    const filteredByWeekNumber = await weekDeliveryPredictionService.listWeekDeliveryPredictions(this.state.selectedItemGroup.id, undefined, this.props.accessToken.userId, lastWeekNumber, year, undefined, 999);
    const lastWeeksDeliveryPredictionTotalAmount = _.sumBy(filteredByWeekNumber, prediction => prediction.amount);
    this.setState({ lastWeeksDeliveryPredictionTotalAmount });

  }

  /**
   * Get year
   * 
   * @return current year
   */
  private getYear = () => {
    return moment().year();
  }

  /**
   * Changes value of radio buttons
   * 
   * @param selected selected
   * @param index index
   */
  private changeWeekDayValue = (selected: boolean, index: number) => {
    const weekDays = this.state.weekDays;
    const day = weekDays[index];

    day.value = !selected;
    weekDays[index] = day

    this.setState({ weekDays });
  }

  /**
   * Changes item group
   * 
   * @param action action
   */
  private changeItemGroup = async (action: string) => {
    const maxValue: number = this.state.itemGroups.length - 1;
    const minValue: number = 0;

    if (action === "next" && this.state.itemGroupIndex !== maxValue) {
      await this.setState({ itemGroupIndex: this.state.itemGroupIndex + 1 });
    }

    if (action === "previous" && this.state.itemGroupIndex !== minValue) {
      await this.setState({ itemGroupIndex: this.state.itemGroupIndex - 1 });
    }
    await this.setState({ selectedItemGroup: this.state.itemGroups[this.state.itemGroupIndex], amount: 0, averageDailyAmount: 0 });
    this.setLastWeeksTotal();
    this.calculatePercentage();
  }

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        {
          this.state.itemGroups.length > 0 ?
            <View style={{ flex: 1, flexDirection: "row", padding: 15 }}>
              <View style={styles.center}>
                <AsyncButton onPress={async () => { await this.changeItemGroup("previous") }} >
                  <Icon style={styles.red} type="Entypo" name="chevron-left"></Icon>
                </AsyncButton>
              </View>
              <View style={{ flex: 8, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontWeight: "bold", fontSize: 20, color: "black" }}>{this.state.selectedItemGroup.displayName}</Text>
              </View>
              <AsyncButton onPress={async () => { await this.changeItemGroup("next") }} >
                <Icon style={styles.red} type="Entypo" name="chevron-right"></Icon>
              </AsyncButton>
            </View>
            :
            <View style={{ padding: 15 }}><Text style={{ color: "black" }}>Ei voimassa olevaa sopimusta. Jos näin ei pitäisi olla, ole yhteydessä Pakkasmarjaan.</Text></View>
        }
        <View style={{ flex: 1, marginBottom: 1 }}>
          <View style={[styles.lightRedBackGroundColor, { flex: 1, flexDirection: "row", paddingVertical: 10 }]}>
            <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", paddingLeft: 20 }}>
              <Text style={styles.textPrediction}>Viime viikon toimitukset</Text>
            </View>
            <View style={{ flex: 0.5, justifyContent: "center", alignItems: "center", paddingRight: 20 }} >
              <Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{`${this.state.lastWeeksDeliveryPredictionTotalAmount} kg`}</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.center, styles.lightRedBackGroundColor, { paddingVertical: 10 }]}>
            <TouchableOpacity onPress={() => this.props.navigation.navigate("ViewAllDeliveries")}>
              <Text style={styles.red}>Katso kaikki toimitukset</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 2, borderBottomColor: "black", borderBottomWidth: 0.7, paddingVertical: 20 }}>
          <View style={[styles.center, { paddingTop: 25, paddingBottom: 20 }]}>
            <Text style={{ fontSize: 24, color: "black", fontWeight: "500" }}>Ennuste ensi viikolle (KG)</Text>
          </View>
          <View style={styles.center}>
            <View style={[styles.center, { width: "90%", height: 70, borderRadius: 7, borderColor: "#e01e36", borderWidth: 1.25, marginBottom: 10 }]}>
              <NumericInput
                value={this.state.amount}
                initValue={this.state.amount}
                onChange={(value: number) => this.handleValueChange(value)}
                totalWidth={Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20}
                totalHeight={50}
                iconSize={35}
                step={100}
                valueType='real'
                minValue={0}
                textColor='black'
                iconStyle={{ color: 'white' }}
                rightButtonBackgroundColor='#e01e36'
                leftButtonBackgroundColor='#e01e36'
                borderColor='transparent'
                rounded
              />
            </View>
          </View>
          <View style={styles.center}>
            <Text style={styles.textPrediction}>Keskimäärin<Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.averageDailyAmount} kg/pv`}</Text></Text>
            <Text style={styles.textPrediction}>Muutos viime viikkoon <Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.percentageAmount} %`}</Text></Text>
          </View>
        </View>
        <View style={[styles.center, { paddingVertical: 20 }]}>
          <Text style={{ fontSize: 22, color: "black", fontWeight: "500" }}>Minä päivinä toimitat?</Text>
          <View style={[styles.center, { paddingVertical: 20 }]}>
            {
              this.state.weekDays.map((day, index) => {
                return (
                  this.renderRadioButton(day.value, day.displayName, index)
                );
              })

            }
          </View>
        </View>
        <View style={styles.center}>
          <AsyncButton style={[styles.deliveriesButton, { width: "70%", height: 60, marginTop: 10, marginBottom: 20 }]} onPress={ this.createNewWeekDeliveryPrediction }>
            <Text style={styles.buttonText}>Lähetä viikkoennuste</Text>
          </AsyncButton>
        </View>
      </BasicScrollLayout>
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

export default connect(mapStateToProps, mapDispatchToProps)(NewWeekDeliveryPrediction);
