import React, { Dispatch } from "react";
import { AccessToken, StoreState } from "../../../types";
import { Text, Form } from "native-base";
import { View, TouchableOpacity, TextInput } from "react-native";
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
interface Props {
  itemGroup: ItemGroup,
  category: string,
  contract: Contract,
  isActiveContract: boolean,
  accessToken?: AccessToken,
  onUserInputChange: (key:any, value:any) => void,
  proposedAmount: string,
  contractAmount?: number,
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
   * On amount change
   * 
   * @param value value
   */
  private onAmountChange = (value: string) => {
    this.props.onUserInputChange("proposedQuantity", value);
  }

  /**
   * On quantity comment change
   * 
   * @param value value
   */
  private onQuantityCommentChange = (value: string) => {
    this.props.onUserInputChange("quantityComment", value);
  }

  /**
   * Render method
   */
  public render() {
    let quantityValue = "0";

    if (this.props.contractAmount && !this.props.proposedAmount) {
      quantityValue = this.props.contractAmount.toString();
    } else {
      quantityValue = this.props.proposedAmount;
    }

    return (
      <View style={this.props.styles.BlueContentView}>
        <View>
          <Text style={this.props.styles.ContentHeader}>
            MÄÄRÄ
          </Text>
        </View>
        <View>
        {
          this.props.itemGroup.category === "FRESH" &&
            <Text style={{fontSize:18,paddingBottom:10}}>
              Tuoremarjasopimuksessa sopimusmäärä on aiesopimus, johon molemmat osapuolet sitoutuvat, ellei kyseessä poikkeustilanne.
            </Text>
        }
        </View>
        <View>
          <Form>
            <Text style={this.props.styles.textSize}>Määrä</Text>
            <TextInput 
              style={this.props.styles.InputStyle}
              editable={!this.props.isActiveContract}
              keyboardType="numeric"
              value={quantityValue}
              onChangeText={(text: string) => this.onAmountChange(text)}
            />
          </Form>
        </View>
        <View>
          <Text style={[this.props.styles.textWithSpace, this.props.styles.textSize]}>
            {`Pakkasmarjan ehdotus: ${this.props.contract.contractQuantity} kg`}
          </Text>
          <TouchableOpacity onPress={() => this.setState({ showPastContracts: !this.state.showPastContracts })}>
            <Text style={this.props.styles.linkStyle}>
              Edellisten vuosien sopimusmäärät ja toimitusmäärät
            </Text>
          </TouchableOpacity>
          <ContractModal
            styles={this.props.styles} 
            closeModal={() => this.setState({showPastContracts: false})} 
            pastContracts={true} 
            modalOpen={this.state.showPastContracts} 
            itemGroupId={this.props.itemGroup.id || ""}
          />
        </View>
        <View>
          <CheckBox
            checked={this.props.deliverAllChecked}
            onPress={() => {
              !this.props.isActiveContract && this.props.onUserInputChange("deliverAllChecked", !this.props.deliverAllChecked)
            }}
            title='Haluaisin toimittaa kaiken tilallani viljeltävän sadon tästä marjasta Pakkasmarjalle pakastettavaksi ja tuorekauppaan (lisätietoja sopimuksen kohdasta 100 % toimittajuus).'
          />
        </View>
        <View>
          <Text style={[this.props.styles.textWithSpace, this.props.styles.textSize]}>Kommentti</Text>
          <TextInput 
            multiline = {true}
            numberOfLines = {4}
            editable={!this.props.isActiveContract}
            style={this.props.styles.textInput}
            value={this.props.quantityComment}
            onChangeText={(text:string) => this.onQuantityCommentChange(text)}
          />
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractAmount);