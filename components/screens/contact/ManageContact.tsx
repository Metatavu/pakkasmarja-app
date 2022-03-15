import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { View, Alert, TextInput, TouchableOpacity, TouchableHighlight, Platform } from "react-native";
import { StoreState, AccessToken, ManageContactKey, ManageContactInput } from "../../../types";
import * as actions from "../../../actions";
import PakkasmarjaApi from "../../../api";
import { Address, Contact } from "pakkasmarja-client";
import { styles } from "../deliveries/styles.tsx";
import TopBar from "../../layout/TopBar";
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import { Icon, Text } from "native-base";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import Auth from "../../../utils/Auth";
import { Picker } from "native-base";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Component props
 */
interface Props {
  accessToken?: AccessToken,
  navigation?: any,
  onAccessTokenUpdate: (accessToken?: AccessToken) => void
}

/**
 * Component state
 */
interface State {
  loading: boolean;
  usersContact?: Contact;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber1: string;
  phoneNumber2: string;
  email: string;
  audit: string;
  sapId: string;
  addresses?: Array<Address>;
  BIC: string;
  IBAN: string;
  taxCode: string;
  vatLiable?: Contact.VatLiableEnum;
  alv: string;
  postNumber: string;
  postAddress: string;
  city: string;
  farmPostNumber: string;
  farmPostAddress: string;
  farmCity: string;
  usersContactCopy: Contact;
  disableSave: boolean;
}

/**
 * Manage contact component
 */
class ManageContact extends React.Component<Props, State> {

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      firstName: '',
      lastName: '',
      companyName: '',
      phoneNumber1: '',
      phoneNumber2: '',
      email: '',
      audit: '',
      sapId: '',
      BIC: '',
      IBAN: '',
      taxCode: '',
      alv: '',
      postNumber: '',
      postAddress: '',
      city: '',
      farmPostNumber: '',
      farmPostAddress: '',
      farmCity: '',
      usersContactCopy: {},
      disableSave: true
    };
  }

  /**
   * Navigation options property
   */
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
        <TouchableHighlight onPress={() => { navigation.goBack() }} >
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
  public componentDidMount = async () => {
    this.props.navigation.setOptions(this.navigationOptions(this.props.navigation));
    const { accessToken } = this.props;
    if (!accessToken || !accessToken.access_token || !accessToken.userId) {
      return;
    }
    this.setState({ loading: true });
    const api = new PakkasmarjaApi();
    const usersContact = await api.getContactsService(accessToken.access_token).findContact(accessToken.userId);
    this.setState({
      loading: false,
      firstName: usersContact.firstName || '',
      lastName: usersContact.lastName || '',
      companyName: usersContact.companyName || '',
      email: usersContact.email || '',
      audit: usersContact.audit || '',
      sapId: usersContact.sapId || '',
      BIC: usersContact.BIC || '',
      IBAN: usersContact.IBAN || '',
      taxCode: usersContact.taxCode || '',
      alv: usersContact.taxCode || '',
      vatLiable: usersContact.vatLiable || "true",
      usersContactCopy: usersContact || {}
    });
    if (usersContact.phoneNumbers) {
      if (usersContact.phoneNumbers[0]) {
        this.setState({
          phoneNumber1: usersContact.phoneNumbers[0]
        });
      }
      if (usersContact.phoneNumbers[1]) {
        this.setState({
          phoneNumber2: usersContact.phoneNumbers[1]
        });
      }
    }
    if (usersContact.addresses) {
      if (usersContact.addresses[0]) {
        this.setState({
          postNumber: usersContact.addresses[0].postalCode || '',
          postAddress: usersContact.addresses[0].streetAddress || '',
          city: usersContact.addresses[0].city || '',
        });
      }
      if (usersContact.addresses[1]) {
        this.setState({
          farmPostNumber: usersContact.addresses[1].postalCode || '',
          farmPostAddress: usersContact.addresses[1].streetAddress || '',
          farmCity: usersContact.addresses[1].city || ''
        });
      }
    }
  }

  /**
   * Component render method
   */
  public render() {
    const basicInfoInputs: ManageContactInput[] = [
      {
        label: "Etunimi",
        key: "firstName"
      },
      {
        label: "Sukunimi",
        key: "lastName"
      },
      {
        label: "Yritys",
        key: "companyName"
      },
      {
        label: "Puhelin 1",
        key: "phoneNumber1"
      },
      {
        label: "Puhelin 2",
        key: "phoneNumber2"
      },
      {
        label: "Sähköposti",
        key: "email"
      },
      {
        label: "Auditoitu",
        key: "audit"
      },
      {
        label: "Viljelijänumero",
        key: "sapId",
        isDisabled: true
      }
    ];

    const addressInfoInputs: ManageContactInput[] = [
      {
        label: "Postinro",
        key: "postNumber"
      },
      {
        label: "Postiosoite",
        key: "postAddress"
      },
      {
        label: "Kaupunki",
        key: "city"
      },
      {
        label: "Tilan postinro",
        key: "farmPostNumber"
      },
      {
        label: "Tilan osoite",
        key: "farmPostAddress"
      },
      {
        label: "Tilan kaupunki",
        key: "farmCity"
      }
    ];

    const bankInfoInputs: ManageContactInput[] = [
      {
        label: "BIC",
        key: "BIC"
      },
      {
        label: "Tilinumero (IBAN)",
        key: "IBAN"
      },
      {
        label: "ALV - tunnus",
        key: "alv"
      }
    ];

    const vatLiableOptions: { key: string, value: Contact.VatLiableEnum | undefined, text: string }[] = [{
      key: "true",
      value: "true",
      text: "Kyllä"
    }, {
      key: "false",
      value: "false",
      text: "Ei"
    }];

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <TouchableOpacity onPress={this.handleLogOut}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", height: 50, backgroundColor: "#E51D2A", marginVertical: 10 }}>
            <Text style={{ color: "#fff", fontSize: 20 }}>Kirjaudu ulos</Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
            <Icon style={{ fontSize: 30, color: '#E51D2A', marginRight: 15 }} type="FontAwesome" name="user" />
            <Text style={{ color: "black", fontWeight: "700", fontSize: 24 }}>Perustiedot</Text>
          </View>
        </View>
        <View style={{ padding: 15 }}>
          {

            basicInfoInputs.map((input) => {
              return this.renderInput(input.label, input.key, input.isDisabled);
            })
          }
        </View>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
            <Icon style={{ fontSize: 30, color: '#E51D2A', marginRight: 15 }} type="FontAwesome" name="address-book" />
            <Text style={{ color: "black", fontWeight: "700", fontSize: 24 }}>Osoitetiedot</Text>
          </View>
        </View>
        <View style={{ padding: 15 }}>
          {
            addressInfoInputs.map((input) => {
              return this.renderInput(input.label, input.key);
            })
          }
        </View>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
            <Icon style={{ fontSize: 30, color: '#E51D2A', marginRight: 15 }} type="FontAwesome" name="university" />
            <Text style={{ color: "black", fontWeight: "700", fontSize: 24 }}>Pankkitiedot</Text>
          </View>
        </View>
        <View style={{ padding: 15 }}>
          {
            bankInfoInputs.map((input) => {
              return this.renderInput(input.label, input.key);
            })
          }

          <View style={{ flex: 1, flexDirection: "column", height: 80, marginBottom: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, color: "black", paddingBottom: 5 }}>ALV - velvollisuus</Text>
            <View style={{
              height: Platform.OS === "ios" ? 40 : 50,
              width: "100%",
              backgroundColor: 'white',
              borderColor: "red",
              borderWidth: 1,
              borderRadius: 4
            }}>
              {Platform.OS !== "ios" &&
                <Picker
                  selectedValue={this.state.vatLiable}
                  style={{ height: 50, width: "100%", color: "black" }}
                  onValueChange={(itemValue: string) => this.handleInputChange("vatLiable", itemValue)}
                >
                  {
                    vatLiableOptions.map(option =>
                      <Picker.Item key={option.key} label={option.text} value={option.value} />
                    )
                  }
                </Picker>
              }
              {
                Platform.OS === "ios" &&
                <ModalSelector
                  data={ vatLiableOptions.map(option => ({ key: option.key, label: option.text })) }
                  selectedKey={this.state.vatLiable}
                  onChange={ ({ key }) => { this.handleInputChange("vatLiable", key) }} />
              }
            </View>
          </View>
          <View style={[styles.center, { flex: 1 }]}>
            <TouchableOpacity style={[(this.state.disableSave) ? styles.disabledButton : styles.deliveriesButton, styles.center, { width: "50%", height: 60, marginTop: 15 }]} onPress={this.handleSave} disabled={ this.state.disableSave }>
              <Text style={styles.buttonText}>Tallenna</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Handles log out
   */
  private handleLogOut = async () => {
    await Auth.removeToken();
    this.props.onAccessTokenUpdate(undefined);
    const resetAction = this.props.navigation.reset({
      index: 0,
      routes: [{ name: "Login" }]
    });
    this.props.navigation.dispatch(resetAction);
  }

  /**
   * Handle input change
   *
   * @param key key
   * @param value value
   */
  private handleInputChange = (key: ManageContactKey, value: string) => {
    const state: State = this.state;
    state[key] = value as any;
    this.setState(state);
    this.detectChanges();
  }

  /**
   * Render input
   *
   * @param label inputs label
   * @param key needs to be the same key with state
   * @param isEditable optional
   */
  private renderInput = (label: string, key: ManageContactKey, isEditable?: boolean) => {
    return (
      <View key={label} style={{ flex: 1, flexDirection: "column", height: 80, marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: "black", paddingBottom: 5 }}>{label}</Text>
        <TextInput
          editable={!isEditable}
          style={{ borderRadius: 4, borderWidth: 1, borderColor: "red", color: "black" }}
          onChangeText={(value) => this.handleInputChange(key, value)}
          value={this.state[key]}
        />
      </View>
    )
  }

  /**
   * Handles save click
   */
  private handleSave = async () => {
    const { accessToken } = this.props;
    if (!accessToken || !accessToken.access_token || !accessToken.userId) {
      return
    }
    const api = new PakkasmarjaApi();
    const contactService = await api.getContactsService(accessToken.access_token);
    const { firstName, lastName, companyName, email, BIC, IBAN, taxCode, audit, phoneNumber1, sapId,
      phoneNumber2, postNumber, postAddress, city, farmPostNumber, farmPostAddress, farmCity, vatLiable } = this.state;

    const phoneNumbers: string[] = [
      phoneNumber1 || "",
      phoneNumber2 || "",
    ];

    const addresses: Address[] = [
      {
        streetAddress: postAddress,
        postalCode: postNumber,
        city: city
      }, {
        streetAddress: farmPostAddress,
        postalCode: farmPostNumber,
        city: farmCity
      }];

    const newContact: Contact = {
      sapId: sapId || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      companyName: companyName || undefined,
      phoneNumbers: phoneNumbers[0] || phoneNumbers[1] ? phoneNumbers : [],
      email: email || undefined,
      BIC: BIC || undefined,
      IBAN: IBAN || undefined,
      taxCode: taxCode || undefined,
      audit: audit || undefined,
      vatLiable: vatLiable || undefined,
      addresses: addresses[0] || addresses[1] ? addresses : []
    };

    contactService.updateContact(newContact, accessToken.userId).then((updatedData) => {
      Alert.alert(
        'Onnistui!',
        `Tietojen päivittäminen onnistui.`,
        [
          { text: 'OK', onPress: () => this.props.navigation.goBack() }
        ]
      );
    }).catch((err) => {
      Alert.alert(
        'Virhe!',
        `Tietojen tallentamisessa tapahtui virhe, yritä myöhemmin uudelleen.`,
        [
          { text: 'OK', onPress: () => this.props.navigation.goBack() }
        ]
      );
    });
  }

  /**
   * Detects changes in users profile information
   */
  private detectChanges = () => {
    let firstName = this.state.usersContactCopy.firstName || '';
    let lastName = this.state.usersContactCopy.lastName || '';
    let companyName = this.state.usersContactCopy.companyName || '';
    let email = this.state.usersContactCopy.email || '';
    let audit = this.state.usersContactCopy.audit || '';
    let sapId = this.state.usersContactCopy.sapId || '';
    let BIC = this.state.usersContactCopy.BIC || '';
    let IBAN = this.state.usersContactCopy.IBAN || '';
    let taxCode = this.state.usersContactCopy.taxCode || '';
    let vatLiable = this.state.usersContactCopy.vatLiable || undefined;
    let phoneNumber1 = "";
    let phoneNumber2 = "";
    let postNumber = "";
    let postAddress = "";
    let city = "";
    let farmPostNumber = "";
    let farmPostAddress = "";
    let farmCity = "";


    if (this.state.usersContactCopy.phoneNumbers) {
      if (this.state.usersContactCopy.phoneNumbers[0]) {
        phoneNumber1 = this.state.usersContactCopy.phoneNumbers[0];
      }
      if (this.state.usersContactCopy.phoneNumbers[1]) {
        phoneNumber2 = this.state.usersContactCopy.phoneNumbers[1];
      }
    }
    if (this.state.usersContactCopy.addresses) {
      if (this.state.usersContactCopy.addresses[0]) {
        postNumber = this.state.usersContactCopy.addresses[0].postalCode || '';
        postAddress = this.state.usersContactCopy.addresses[0].streetAddress || '';
        city = this.state.usersContactCopy.addresses[0].city || '';
      }
      if (this.state.usersContactCopy.addresses[1]) {
        farmPostNumber = this.state.usersContactCopy.addresses[1].postalCode || '',
        farmPostAddress = this.state.usersContactCopy.addresses[1].streetAddress || '',
        farmCity = this.state.usersContactCopy.addresses[1].city || ''
      }
    }
    if (
      this.state.firstName === firstName &&
      this.state.lastName === lastName &&
      this.state.companyName === companyName &&
      this.state.phoneNumber1 === phoneNumber1 &&
      this.state.phoneNumber2 === phoneNumber2 &&
      this.state.email === email &&
      this.state.audit === audit &&
      this.state.sapId === sapId &&
      this.state.BIC === BIC &&
      this.state.IBAN === IBAN &&
      this.state.taxCode === taxCode &&
      this.state.alv === taxCode &&
      this.state.postNumber === postNumber &&
      this.state.postAddress === postAddress &&
      this.state.city === city &&
      this.state.farmPostNumber === farmPostNumber &&
      this.state.farmPostAddress === farmPostAddress &&
      this.state.farmCity === farmCity &&
      this.state.vatLiable === vatLiable
    ) {
      this.setState({disableSave:true});
    } else {
      this.setState({disableSave:false});
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
    onAccessTokenUpdate: (accessToken?: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageContact);
