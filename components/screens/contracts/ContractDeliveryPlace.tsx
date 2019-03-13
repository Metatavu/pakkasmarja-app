import React from "react";
import { Text } from "native-base";
import { View, Picker, TextInput } from "react-native";
import { Contract, DeliveryPlace } from "pakkasmarja-client";
import { styles } from "./styles";

/**
 * Interface for component props
 */
interface Props {
  contract?: Contract,
  deliveryPlaces?: DeliveryPlace[],
  styles?: any,
  onUserInputChange: (key: any, value: any) => void,
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

  /**
   * Component did mount life cycle event
   */
  public componentDidMount = () => {
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
   * 
   * @param value value
   */
  private onDeliveryPlaceChange = (value: string) => {
    this.props.onUserInputChange("deliveryPlaceComment", value);
  }


  /**
   * Render method
   */
  public render() {
    return (
      <View style={styles.BlueContentView}>
        <View>
          <Text style={styles.ContentHeader}>
            Toimituspaikka
          </Text>
          <View style={{
            height: 50,
            width: "100%",
            backgroundColor: 'white',
            borderColor: "red",
            borderWidth: 1,
            borderRadius: 4
          }}>
            <Picker
              selectedValue={this.props.selectedPlace}
              enabled={!this.props.isActiveContract}
              style={{height:50,width:"100%", color:"black"}}
              onValueChange={(itemValue, itemIndex) =>
                this.props.onUserInputChange("deliveryPlace", itemValue)
              }>
              {
                this.props.deliveryPlaces && this.props.deliveryPlaces.map((deliveryPlace) => {
                  return (
                    <Picker.Item key={deliveryPlace.id} label={deliveryPlace.name || ""} value={deliveryPlace.id} />
                  );
                })
              }
            </Picker>
          </View>
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
          <Text style={[styles.textWithSpace, styles.textSize]}>Kommentti</Text>
          <TextInput
            multiline={true}
            numberOfLines={4}
            editable={!this.props.isActiveContract}
            style={styles.textInput}
            value={this.props.deliveryPlaceComment}
            onChangeText={(text: string) => this.onDeliveryPlaceChange(text)}
          />
        </View>
      </View>
    );
  }
}