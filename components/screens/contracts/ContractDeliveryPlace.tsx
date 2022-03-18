import React from "react";
import { Text } from "native-base";
import { View, TextInput, Platform } from "react-native";
import { Contract, DeliveryPlace } from "pakkasmarja-client";
import { styles } from "./styles";
import ModalSelector from 'react-native-modal-selector';
import { Picker } from "native-base";

/**
 * Interface for component props
 */
interface Props {
  contract?: Contract,
  deliveryPlaces?: DeliveryPlace[],
  styles?: any,
  onUserInputChange: (key: any, value: any) => void,
  selectedPlaceId: string,
  deliveryPlaceComment: string,
  isActiveContract: boolean
};

/**
 * Interface for component state
 */
interface State {
  proposedDeliveryPlace?: string;
  pickerOpacity: number;
  buttonOpacity: number;
};

export default class ContractDeliveryPlace extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      pickerOpacity: 0,
      buttonOpacity: 1
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
            height: Platform.OS === "ios" ? 40 : 50,
            width: "100%",
            backgroundColor: 'white',
            borderColor: "red",
            borderWidth: 1,
            borderRadius: 4
          }}>
            {Platform.OS !== "ios" &&
              <Picker
                selectedValue={this.props.selectedPlaceId}
                enabled={!this.props.isActiveContract}
                style={{height:50,width:"100%", color:"black"}}
                onValueChange={(itemValue: string) =>
                  this.props.onUserInputChange("proposedDeliveryPlaceId", itemValue)
                }>
                {
                  this.props.deliveryPlaces && this.props.deliveryPlaces.map((deliveryPlace) => {
                    return (
                      <Picker.Item key={deliveryPlace.id} label={deliveryPlace.name || ""} value={deliveryPlace.id} />
                    );
                  })
                }
              </Picker>
            }
            {
              Platform.OS === "ios" &&
                <ModalSelector
                  data={
                    this.props.deliveryPlaces?.map(deliveryPlace => ({
                      key: deliveryPlace.id,
                      label: deliveryPlace.name
                    })) || []
                  }
                  selectedKey={this.props.selectedPlaceId}
                  initValue="Valitse toimituspaikka"
                  onChange={(option: any)=>{ this.props.onUserInputChange("deliveryPlaceId", option.key) }} />
            }
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
            numberOfLines={Platform.OS === 'ios' ? undefined : 4}
            style={{... styles.textInput, height: Platform.OS === "ios" ? 80 : undefined}}
            editable={!this.props.isActiveContract}
            value={this.props.deliveryPlaceComment}
            onChangeText={(text: string) => this.onDeliveryPlaceChange(text)}
          />
        </View>
      </View>
    );
  }
}