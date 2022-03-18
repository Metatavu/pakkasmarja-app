import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryListItem, KeyboardType, boxKey } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight } from "react-native";
import { Product, DeliveryPlace, ItemGroupCategory, Contact, Body1 } from "pakkasmarja-client";
import { Text, Icon, Input, ListItem } from "native-base";
import moment from "moment"
import PakkasmarjaApi from "../../../api";
import FeatherIcon from "react-native-vector-icons/Feather";
import DateTimePicker from "react-native-modal-datetime-picker";
import { styles } from "../deliveries/styles.tsx";
import Autocomplete from 'native-base-autocomplete';
import AsyncButton from "../../generic/async-button";
import strings from "../../../localization/strings";
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
  deliveryPlaces?: DeliveryPlace[];
  contacts?: Contact[];
  deliveryPlaceId?: string;
  products: Product[];
  datepickerVisible: boolean,
  modalOpen: boolean;
  loading: boolean;
  amount: number;
  selectedDate: Date;
  createModal: boolean;
  editModal: boolean;
  category?: ItemGroupCategory;

  redBoxesLoaned: number;
  redBoxesReturned: number;
  grayBoxesLoaned: number;
  grayBoxesReturned: number;
  deliveryLoanComment: string;

  query?: string;
  selectedContact?: Contact;
};

/**
 * ManageBoxDelivery
 */
class ManageBoxDelivery extends React.Component<Props, State> {

  private queryDebounce?: NodeJS.Timeout;

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      datepickerVisible: false,
      modalOpen: false,
      amount: 0,
      products: [],
      createModal: false,
      editModal: false,
      selectedDate: new Date(),

      redBoxesLoaned: 0,
      redBoxesReturned: 0,
      grayBoxesLoaned: 0,
      grayBoxesReturned: 0,
      deliveryLoanComment: "",

      query: ""
    };
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerTitle: () => (
        <TopBar navigation={navigation}
          showMenu={true}
          showHeader={false}
          showUser={true}
        />
      ),
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft: () =>(
        <TouchableHighlight onPress={ () => { navigation.goBack(null) }}>
          <FeatherIcon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      )
    }
  };

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { navigation, route, accessToken } = this.props;
    const { date, category } = route.params;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken?.access_token) {
      return;
    }

    this.setState({
      loading: true,
      category: category,
      selectedDate: date
    });

    const deliveryPlaces = await new PakkasmarjaApi()
      .getDeliveryPlacesService(accessToken.access_token)
      .listDeliveryPlaces();

    this.setState({
      deliveryPlaces: deliveryPlaces.filter(deliveryPlace => deliveryPlace.name !== "Muu"),
      deliveryPlaceId: deliveryPlaces[0].id,
      amount: 0,
      loading: false
    });
  }

  /**
   * Handles accept delivery
   */
  private handleDeliveryLoanAccept = async () => {
    const { accessToken, navigation } = this.props;
    const {
      deliveryPlaceId,
      selectedDate,
      selectedContact,
      deliveryLoanComment,
      redBoxesLoaned,
      redBoxesReturned,
      grayBoxesLoaned,
      grayBoxesReturned
    } = this.state;

    if (!accessToken|| !deliveryPlaceId|| !selectedDate || !selectedContact?.id) {
      return;
    }

    const deliveryLoansService = new PakkasmarjaApi().getDeliveryLoansService(accessToken.access_token);

    const deliveryLoan: Body1 = {
      contactId: selectedContact.id,
      comment: deliveryLoanComment,
      loans: [
        { item: "RED_BOX", loaned: redBoxesLoaned, returned: redBoxesReturned },
        { item: "GRAY_BOX", loaned: grayBoxesLoaned, returned: grayBoxesReturned }
      ]
    }

    try {
      await deliveryLoansService.createDeliveryLoan(deliveryLoan);
      navigation.navigate("ManageDeliveries");
    } catch(error) {
      console.warn(error);
    }
  }

  /**
    * Prints time
    *
    * @param date
    *
    * @return formatted start time
    */
  private printTime(date: Date): string {
    return moment(date).format("DD.MM.YYYY HH:mm");
  }

  /**
   * Find contacts
   *
   * @param query query string
   */
  private findContacts = (query?: string) => {
    const { accessToken } = this.props;

    if (this.queryDebounce) {
      clearTimeout(this.queryDebounce);
      this.queryDebounce = undefined;
    }

    this.setState({ query: query });

    if (!accessToken || !query) {
      this.setState({ contacts: [] });
      return;
    }

    this.queryDebounce = setTimeout(async () => {
      this.setState({
        contacts: await new PakkasmarjaApi()
          .getContactsService(accessToken.access_token)
          .listContacts(query)
      });
    }, 500);
  }

  /**
   * Returns whether form is valid or not
   *
   * @return whether form is valid or not
   */
  private isValid = () => {
    const { selectedContact, selectedDate, deliveryPlaceId } = this.state;
    return !!(selectedContact && selectedDate && deliveryPlaceId);
  }

  /**
   * Render input field
   *
   * @param key key
   * @param keyboardType keyboardType
   * @param label label
   */
  private renderInputField = (key: boxKey, keyboardType: KeyboardType, label: string) => {
    return (
      <View key={ key }>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={ styles.textWithSpace }>
            { label }
          </Text>
        </View>
        <Input
          style={{
            height: 50,
            borderColor: "red",
            backgroundColor: "white",
            borderWidth: 1,
            borderRadius: 8,
            textAlign: "center"
          }}
          keyboardType={ keyboardType }
          value={ this.state[key].toString() }
          onChangeText={ (text: string) => this.setState({ ...this.state, [key]: Number(text) }) }
        />
      </View>
    );
  }

  /**
   * Render method
   */
  public render() {
    const { navigation } = this.props;
    const {
      loading,
      query,
      selectedContact,
      contacts,
      selectedDate,
      datepickerVisible,
      category,
      deliveryLoanComment
    } = this.state;

    if (loading) {
      return (
        <View style={ styles.loaderContainer }>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    const compareValues = (a: any, b: any) => a.toLowerCase().trim() === b.toLowerCase().trim();

    const boxInputs: { key: boxKey, label: string }[] = [{
      key: "redBoxesLoaned",
      label: "Lainattu (Punaiset laatikot)"
    },
    {
      key: "redBoxesReturned",
      label: "Palautettu (Punaiset laatikot)"
    },
    {
      key: "grayBoxesLoaned",
      label: "Lainattu (Harmaat laatikot)"
    },
    {
      key: "grayBoxesReturned",
      label: "Palautettu (Harmaat laatikot)"
    }];

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View style={ styles.deliveryContainer }>
            <View>
              <Autocomplete
                autoCapitalize="none"
                autoCorrect={ false }
                data={ contacts?.length === 1 && compareValues(query, contacts[0].displayName) ? [] : contacts }
                defaultValue={ query }
                onChangeText={ (text: any) => this.findContacts(text) }
                placeholder="Kirjoita kontaktin nimi"
                hideResults={ (selectedContact?.displayName || "") === query }
                renderItem={ (contact: any) => (
                  <ListItem
                    style={{ backgroundColor: "#fff" }}
                    onPress={ () => this.setState({ selectedContact: contact, query: contact.displayName }) }
                  >
                    <Text>{ contact.displayName }</Text>
                  </ListItem>
                  )
                }
              />
            </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 5 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <Text style={ styles.textWithSpace }>Toimituspäivä</Text>
              </View>
              <TouchableOpacity style={ styles.pickerWrap } onPress={ () => this.setState({ datepickerVisible: true }) }>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 3, justifyContent: "center", alignItems: "flex-start" }}>
                    <Text style={{ paddingLeft: 10 }}>
                      { selectedDate ? this.printTime(selectedDate) : "Valitse päivä" }
                    </Text>
                  </View>
                  <View style={[ styles.center, { flex: 0.6 } ]}>
                    <Icon
                      style={{ color: "#e01e36" }}
                      type="AntDesign"
                      name="calendar"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              date={ selectedDate }
              mode="datetime"
              is24Hour
              isVisible={ datepickerVisible }
              onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
              onCancel={() => { this.setState({ datepickerVisible: false }); }}
            />
          </View>
          { category === "FROZEN" &&
            boxInputs.map(({ key, label }) => this.renderInputField(key, "numeric", label))
          }
          <View>
            <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
              <Text style={ styles.textWithSpace }>
                { strings.comment }
              </Text>
            </View>
            <Input
              style={{
                height: 50,
                borderColor: "red",
                backgroundColor: "white",
                borderWidth: 1,
                borderRadius: 8,
                textAlign: "center"
              }}
              keyboardType="default"
              value={ deliveryLoanComment || "" }
              onChangeText={(text: string) => this.setState({ deliveryLoanComment: text })}
            />
          </View>
          {
            !this.isValid() &&
            <View style={ styles.center }>
              <Text style={{ color: "red" }}>Puuttuu tarvittavia tietoja</Text>
            </View>
          }
          <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
            <AsyncButton
              disabled={ !this.isValid() }
              style={[ styles.deliveriesButton, styles.center, { width: "70%", height: 60, marginTop: 15 } ]}
              onPress={ this.handleDeliveryLoanAccept }
            >
              <Text style={ styles.buttonText }>Hyväksy toimitus</Text>
            </AsyncButton>
          </View>
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
    accessToken: state.accessToken,
    itemGroupCategory: state.itemGroupCategory,
    deliveries: state.deliveries
  };
}

/**
 * Redux mapper for mapping component dispatches
 *
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageBoxDelivery);
