import React from "react";
import { Contact } from "pakkasmarja-client";
import { Text } from "native-base";
import { View, StyleSheet, Picker, TextInput } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract, DeliveryPlace } from "pakkasmarja-client";


/**
 * Interface for component props
 */
export interface Props {
  contract?: Contract,
  deliveryPlaces?: DeliveryPlace[],
  styles?:any,
  onUserInputChange: (key:any, value:any) => void,
  selectedPlace: string,
  deliveryPlaceComment: string,
  isActiveContract: boolean
};

/**
 * Interface for component state
 */
interface State {
  proposedDeliveryPlace?: string
};

export default class ContractDeliveryPlace extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount = () => {
    if (!this.props.deliveryPlaces || !this.props.contract || !this.props.contract.deliveryPlaceId) {
      return;
    }
    const proposedId = this.props.contract.deliveryPlaceId;
    const proposedDeliveryPlace = this.props.deliveryPlaces.find(place => place.id === proposedId);
    if (proposedDeliveryPlace) {
      this.setState({ proposedDeliveryPlace: proposedDeliveryPlace.name });
    }
  }

  /**
   * On delivery place comment change
   */
  onDeliveryPlaceChange = (event: any) => {
    this.props.onUserInputChange("deliveryPlaceComment", event.currentTarget.value);
  }


  /**
   * Render method for contract parties component
   */
  public render() {
    
    return (
      <View style={this.props.styles.BlueContentView}>
        <View>
          <Text style={this.props.styles.ContentHeader}>
            Toimituspaikka
          </Text>
          <Picker
            selectedValue={this.props.selectedPlace}
            enabled={!this.props.isActiveContract}
            style={{height: 50, width: "100%", backgroundColor:"white"}}
            onValueChange={(itemValue, itemIndex) =>
              this.props.onUserInputChange("deliveryPlace", itemValue)
            }>
            {
              this.props.deliveryPlaces && this.props.deliveryPlaces.map((deliveryPlace) => {
                return (
                  <Picker.Item label={deliveryPlace.name || ""} value={deliveryPlace.id} />
                );
              })
            }
          </Picker>
        </View>
        <View>
          { 
            this.state.proposedDeliveryPlace && 
              <Text>
                {`Pakkasmarjan ehdotus: ${this.state.proposedDeliveryPlace}`}
              </Text>
          }
        </View>
        <View>
        <Text style={[this.props.styles.textWithSpace, this.props.styles.readingText]}>Kommentti</Text>
        <TextInput 
          multiline = {true}
          numberOfLines = {4}
          editable={!this.props.isActiveContract}
          style={this.props.styles.textInput}
          value={this.props.deliveryPlaceComment}
          onChange={this.onDeliveryPlaceChange}
        />
        </View>
      </View>
    );
  }
}