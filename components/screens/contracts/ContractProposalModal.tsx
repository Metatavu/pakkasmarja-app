import React from "react";
import { Text } from "native-base";
import { View, TouchableOpacity, Picker, TextInput, Platform } from "react-native";
import Modal from "react-native-modal";
import { ItemGroup } from "pakkasmarja-client";
import { styles } from "./styles";
import ModalSelector from 'react-native-modal-selector';
import AsyncButton from "../../generic/async-button";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  closeModal: () => void,
  itemGroups: ItemGroup[],
  selectedBerry: string,
  onSelectedBerryChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityCommentChange: (value: string) => void;
  sendContractProposalClicked: () => void;
  quantity: string,
  quantityComment: string,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
};

/**
 * Contract proposal modal component class
 */
export default class ContractProposalModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false
    };
  }

  /**
   * Close modal
   */
  private closeModal = () => {
    this.props.closeModal();
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen}>
          <View style={styles.proposalModalView}>
            <View>
              <Text style={styles.contentHeader}>
                Ehdota sopimusta jostain muusta marjasta
              </Text>
            </View>
            <View>
              {Platform.OS !== "ios" &&
                <View style={{
                  height: 50,
                  width: "100%",
                  backgroundColor: 'white',
                  borderColor: "red",
                  borderWidth: 1,
                  borderRadius: 4
                }}>
                  <Picker
                    selectedValue={this.props.selectedBerry}
                    style={{height:50,width:"100%", color:"black"}}
                    onValueChange={(itemValue, itemIndex) =>
                      this.props.onSelectedBerryChange(itemValue)
                    }>
                    {
                      this.props.itemGroups.map((itemGroup) => {
                        return (
                          <Picker.Item key={itemGroup.id} label={itemGroup.name || ""} value={itemGroup.id} />
                        );
                      })
                    }
                  </Picker>
                </View>
            }
            {
              Platform.OS === "ios" &&
                <ModalSelector
                  data={this.props.itemGroups && this.props.itemGroups.map((itemGroup) => {
                    return {
                      key: itemGroup.id,
                      label: itemGroup.displayName || itemGroup.name
                    };
                  })}
                  selectedKey={this.props.selectedBerry}
                  initValue="Valitse marjalaji"
                  onChange={(option: any)=>{ this.props.onSelectedBerryChange(option.key) }} />
            }
            </View>
            <View>
              <Text style={styles.Text}>Määrä</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={this.props.quantity}
                onChangeText={(text: string) => this.props.onQuantityChange(text)}
              />
            </View>
            <View>
              <Text style={styles.Text}>Kommentti</Text>
              <TextInput
                multiline={true}
                numberOfLines={Platform.OS === 'ios' ? undefined : 4}
                style={{... styles.textInput, height: Platform.OS === "ios" ? 80 : undefined}}
                value={this.props.quantityComment}
                onChangeText={(text: string) => this.props.onQuantityCommentChange(text)}
              />
            </View>
            <View style={[styles.flexView, {marginTop:20}]}>
              <TouchableOpacity style={styles.smallWhiteButton} onPress={this.closeModal}>
                <Text style={styles.smallWhiteButtonText}>Sulje</Text>
              </TouchableOpacity>
              <AsyncButton style={styles.smallRedButton} onPress={this.props.sendContractProposalClicked}>
                <Text style={styles.buttonText}>Lähetä</Text>
              </AsyncButton>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}