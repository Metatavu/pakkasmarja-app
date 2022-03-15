import React, { Dispatch } from "react";
import { AccessToken, StoreState } from "../../../types";
import { Text, Form, CheckBox, Body, ListItem } from "native-base";
import { View, TouchableOpacity, TextInput, Platform } from "react-native";
import { Contract, ItemGroup } from "pakkasmarja-client";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import ContractModal from "./ContractModal";
import { styles } from "./styles";

/**
 * Interface for component props
 */
interface Props {
  itemGroup: ItemGroup,
  category: string,
  contract: Contract,
  isActiveContract: boolean,
  accessToken?: AccessToken,
  onUserInputChange: (key: any, value: any) => void,
  proposedAmount: number,
  contractAmount?: number,
  quantityComment: string,
  deliverAllChecked: boolean,
  styles?: any,
  allowDeliveryAll: boolean
};

/**
 * Interface for component state
 */
interface State {
  showPastContracts: boolean,
  pastContracts: Contract[]
};

class ContractAmount extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      showPastContracts: false,
      pastContracts: []
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
    let quantityValue = 0;

    if (this.props.contractAmount && !this.props.proposedAmount) {
      quantityValue = this.props.contractAmount;
    } else {
      quantityValue = this.props.proposedAmount;
    }

    return (
      <View style={styles.BlueContentView}>
        <View>
          <Text style={styles.ContentHeader}>
            MÄÄRÄ
          </Text>
        </View>
        <View>
          {
            this.props.itemGroup.category === "FRESH" &&
            <Text style={{ fontSize: 18, paddingBottom: 10 }}>
              Tuoremarjasopimuksessa sopimusmäärä on aiesopimus, johon molemmat osapuolet sitoutuvat, ellei kyseessä poikkeustilanne.
            </Text>
          }
        </View>
        <View>
          <Form>
            <Text style={styles.textSize}>Määrä</Text>
            <TextInput
              style={styles.InputStyle}
              editable={!this.props.isActiveContract}
              keyboardType="numeric"
              value={quantityValue.toString()}
              onChangeText={(text: string) => this.onAmountChange(text)}
            />
          </Form>
        </View>
        <View>
          <Text style={[styles.textWithSpace, styles.textSize]}>
            {`Pakkasmarjan ehdotus: ${this.props.contract.contractQuantity} kg`}
          </Text>
          <TouchableOpacity onPress={() => this.setState({ showPastContracts: !this.state.showPastContracts })}>
            <Text style={styles.linkStyle}>
              Edellisten vuosien sopimusmäärät ja toimitusmäärät
            </Text>
          </TouchableOpacity>
          <ContractModal
            closeModal={() => this.setState({ showPastContracts: false })}
            modalOpen={this.state.showPastContracts}
            itemGroupId={this.props.itemGroup.id || ""}
          />
        </View>
        {
          this.props.allowDeliveryAll &&
          <View style={{ backgroundColor: "#fff", width: "100%", borderRadius: 4 }}>
            <ListItem>
              <CheckBox
                color={ this.props.isActiveContract ? "#AAA" : "#E51D2A" }
                checked={ this.props.deliverAllChecked }
                disabled={ this.props.isActiveContract }
                onPress={ () => !this.props.isActiveContract && this.props.onUserInputChange("deliverAllChecked", !this.props.deliverAllChecked) }
              />
              <Body>
                <Text>
                  Haluaisin toimittaa kaiken tilallani viljeltävän sadon tästä marjasta Pakkasmarjalle pakastettavaksi ja tuorekauppaan (lisätietoja sopimuksen kohdasta 100 % toimittajuus).
                </Text>
              </Body>
            </ListItem>
          </View>
        }
        <View>
          <Text style={[styles.textWithSpace, styles.textSize]}>Kommentti</Text>
          <TextInput
            multiline={true}
            numberOfLines={Platform.OS === 'ios' ? undefined : 4}
            style={{ ...styles.textInput, height: Platform.OS === "ios" ? 80 : undefined }}
            editable={!this.props.isActiveContract}
            value={this.props.quantityComment}
            onChangeText={(text: string) => this.onQuantityCommentChange(text)}
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