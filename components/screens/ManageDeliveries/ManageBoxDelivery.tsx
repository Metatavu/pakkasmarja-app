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
    const selectedDate: Date = this.props.navigation.state.params.date;
    const deliveryData: DeliveryListItem = this.props.navigation.state.params.deliveryListItem;
    const category: ItemGroupCategory = this.props.navigation.state.params.category;

    if (!this.props.accessToken) {
      return;
    }

    this.setState({ loading: true, category, selectedDate });
    const Api = new PakkasmarjaApi();
    const deliveryPlaces = await Api.getDeliveryPlacesService(this.props.accessToken.access_token).listDeliveryPlaces();
    this.setState({
      deliveryPlaces: deliveryPlaces.filter(deliveryPlace => deliveryPlace.name !== "Muu")
    });

    this.setState({
      deliveryPlaceId: deliveryPlaces[0].id,
      amount: 0,
      loading: false
    });
}

  /**
   * Component did update life-cycle event
   */
  public componentDidUpdate = (prevProps: Props, prevState: State) => {

  }

  /**
   * Handles accept delivery
   */
  private handleDeliveryLoanAccept = async () => {
    const { deliveryPlaceId, selectedDate, selectedContact, deliveryLoanComment, redBoxesLoaned, redBoxesReturned, grayBoxesLoaned, grayBoxesReturned } = this.state;
    const { accessToken, navigation } = this.props;
    if (!accessToken|| !deliveryPlaceId|| !selectedDate || !selectedContact || !selectedContact.id) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryLoansService = await Api.getDeliveryLoansService(accessToken.access_token);

    const deliveryLoan: Body1 = {
      contactId: selectedContact.id,
      comment: deliveryLoanComment,
      loans: [
        { item: "RED_BOX", loaned: redBoxesLoaned, returned: redBoxesReturned },
        { item: "GRAY_BOX", loaned: grayBoxesLoaned, returned: grayBoxesReturned }
      ]
    }

    try {
      await deliveryLoansService.createDeliveryLoan(deliveryLoan)
      navigation.navigate("Deliveries");
    } catch(error) {
      console.log(error);
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
   * Find contact
   */
  private findContacts = async (query: any) => {
    if (query === '' || !this.props.accessToken) {
      return [];
    }

    this.setState({ query });
    const Api = new PakkasmarjaApi();
    const contacts = await Api.getContactsService(this.props.accessToken.access_token).listContacts(query);
    this.setState({ contacts });

  }

  /**
   * Returns whether form is valid or not
   * 
   * @return whether form is valid or not
   */
  private isValid = () => {
    return !!(this.state.selectedContact && this.state.selectedDate && this.state.deliveryPlaceId);
  }

  /**
   * Render input field
   * 
   * @param index index
   * @param key key
   * @param keyboardType keyboardType
   * @param value value
   */
  private renderInputField = (key: boxKey, keyboardType: KeyboardType, label: string) => {
    return (
      <View key={key}>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={styles.textWithSpace}>{label}</Text>
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
          keyboardType={keyboardType}
          value={this.state[key].toString()}
          onChangeText={(text: string) => this.setState({ ...this.state, [key]: Number(text) })}
        />
      </View>
    );
  }
  
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

    const { query, selectedContact } = this.state;
    const comp = (a: any, b: any) => a.toLowerCase().trim() === b.toLowerCase().trim();

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
    }]

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.deliveryContainer}>
            <View>
              <Autocomplete
                autoCapitalize="none"
                autoCorrect={false}
                data={this.state.contacts && this.state.contacts.length === 1 && comp(query, this.state.contacts[0].displayName)
                  ? [] : this.state.contacts}
                defaultValue={query}
                onChangeText={(text: any) => this.findContacts(text)}
                placeholder="Kirjoita kontaktin nimi"
                hideResults={selectedContact && selectedContact.displayName === query}
                renderItem={(contact: any) =>
                  <ListItem
                    style={{ backgroundColor: "#fff" }}
                    onPress={() => (
                      this.setState({ selectedContact: contact, query: contact.displayName })
                    )}
                  >
                    <Text>{contact.displayName}</Text>
                  </ListItem>}
              />
            </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 5 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <Text style={styles.textWithSpace}>Toimituspäivä</Text>
              </View>
              <TouchableOpacity style={styles.pickerWrap} onPress={() => this.setState({ datepickerVisible: true })}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 3, justifyContent: "center", alignItems: "flex-start" }}>
                    <Text style={{ paddingLeft: 10 }}>
                      {
                        this.state.selectedDate ? this.printTime(this.state.selectedDate) : "Valitse päivä"
                      }
                    </Text>
                  </View>
                  <View style={[styles.center, { flex: 0.6 }]}>
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
              date={ this.state.selectedDate }
              mode="datetime"
              is24Hour={true}
              isVisible={this.state.datepickerVisible}
              onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
              onCancel={() => { this.setState({ datepickerVisible: false }); }}
            />
          </View>
          {
            this.state.category === "FROZEN" &&
            boxInputs.map(box => {
              return this.renderInputField(box.key, "numeric", box.label)
            })
          }
          <View>
            <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
              <Text style={styles.textWithSpace}>{ strings.comment }</Text>
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
              value={this.state.deliveryLoanComment || ""}
              onChangeText={(text: string) => this.setState({ deliveryLoanComment: text })}
            />
          </View>
          {
            !this.isValid() &&
            <View style={styles.center}>
              <Text style={{ color: "red" }}>Puuttuu tarvittavia tietoja</Text>
            </View>
          }
          <View style={[styles.center, { flex: 1 }]}>
            <AsyncButton
              disabled={ !this.isValid() }
              style={[ styles.deliveriesButton, styles.center, { width: "70%", height: 60, marginTop: 15 } ]}
              onPress={ this.handleDeliveryLoanAccept }
            >
              <Text style={styles.buttonText}>Hyväksy toimitus</Text>
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
