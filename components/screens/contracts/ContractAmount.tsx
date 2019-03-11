import React, { Dispatch } from "react";
import { Contact, Price, ContractModel, AccessToken, StoreState } from "../../../types";
import { Text, Form, Item, Label, Input } from "native-base";
import { View, TouchableOpacity, Modal, TextInput, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract, ItemGroup } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import * as actions from "../../../actions";
import { connect } from "react-redux";
import ContractModal from "./ContractModal";
import { CheckBox } from "react-native-elements";


/**
 * Interface for component props
 */
export interface Props {
  itemGroup: ItemGroup,
  category: string,
  contract: Contract,
  isActiveContract: boolean,
  accessToken?: AccessToken,
  onUserInputChange: (key:any, value:any) => void,
  proposedAmount: string,
  quantityComment: string,
  deliverAllChecked: boolean,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  showPastContracts: boolean,
  pastContracts: Contract[],
};

class ContractAmount extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      showPastContracts: false,
      pastContracts: [],
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = () => {
  }

  /**
   * Load past contracts
   */
  private loadPastContracts = async () => {
    if (!this.props.accessToken) {
      return;
    }
    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contractsService = api.getContractsService(this.props.accessToken.access_token);

    const contracts = await contractsService.listContracts("application/json", true, this.props.category);
    this.setState({pastContracts: contracts});
  }

  /**
   * Toggle display of past prices
   */
  private togglePastContracts = async () => {
    if (this.state.showPastContracts) {
      this.setState({ showPastContracts: false });
    } else {
      await this.loadPastContracts();
      this.setState({ showPastContracts: true });
    }
  }

  /**
   * On amount change
   */
  private onAmountChange = (event: any) => {
    this.props.onUserInputChange("proposedQuantity", event.currentTarget.value);
  }

  /**
   * On quantity comment change
   */
  private onQuantityCommentChange = (event: any) => {
    this.props.onUserInputChange("quantityComment", event.currentTarget.value);
  }

  /**
   * Render method for contract amount component
   */
  public render() {
    return (
      <View style={this.props.styles.BlueContentView}>
        <Text style={this.props.styles.ContentHeader}>
          Määrä
        </Text>
        {this.props.itemGroup.category === "FRESH" &&
          <Text style={{fontSize:18,paddingBottom:10}}>Tuoremarjasopimuksessa sopimusmäärä on aiesopimus, johon molemmat osapuolet sitoutuvat, ellei kyseessä poikkeustilanne.</Text>
        }
        <Form>
          <Text style={this.props.styles.readingText}>Määrä</Text>
          <Item>
            <Input 
              style={this.props.styles.InputStyle}
              editable={this.props.isActiveContract}
              keyboardType="numeric"
              value={this.props.proposedAmount}
              onChange={this.onAmountChange}
            />
          </Item>
        </Form>
        <Text style={[this.props.styles.textWithSpace, this.props.styles.readingText]}>
          {`Pakkasmarjan ehdotus: ${this.props.contract.contractQuantity} kg`}
        </Text>
        <TouchableOpacity onPress={this.togglePastContracts}>
          <Text style={{ textDecorationLine: "underline", color: "blue" }}>
            Edellisten vuosien sopimusmäärät ja toimitusmäärät
          </Text>
        </TouchableOpacity>
        <ContractModal styles={this.props.styles} closeModal={() => this.setState({showPastContracts: false})} pastContracts={true} modalOpen={this.state.showPastContracts} itemGroupId={this.props.itemGroup.id || ""}/>
        <CheckBox
          checked={this.props.deliverAllChecked}
          onPress={() => this.props.onUserInputChange("deliverAllChecked", !this.props.deliverAllChecked)}
          title='Haluaisin toimittaa kaiken tilallani viljeltävän sadon tästä marjasta Pakkasmarjalle pakastettavaksi ja tuorekauppaan (lisätietoja sopimuksen kohdasta 100 % toimittajuus).'
        />
        <Text style={[this.props.styles.textWithSpace, this.props.styles.readingText]}>Kommentti</Text>
        <TextInput 
          multiline = {true}
          numberOfLines = {4}
          style={this.props.styles.textInput}
          value={this.props.quantityComment}
          onChange={this.onQuantityCommentChange}
        />
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractAmount);