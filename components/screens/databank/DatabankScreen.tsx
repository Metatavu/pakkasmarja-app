import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import FeatherIcon from "react-native-vector-icons/Feather";
import { StoreState, AccessToken } from "../../../types";
import { View, TouchableHighlight, Image } from "react-native";
import { ItemGroup } from "pakkasmarja-client";
import * as actions from "../../../actions";
import TopBar from "../../layout/TopBar";
import { Text, Fab, Container } from "native-base";
import { DEFAULT_FILE, PDF_FILE, IMAGE_FILE } from '../../../static/images/';
import { Icon } from 'react-native-elements'

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
}

/**
 * Component state
 */
interface State {
  selectedItemGroup?: ItemGroup;
  /**
   * Path to the current location in databank
   */
  path: string;
  /**
   * Example folder structure that will be rendered
   */
  exampleFolderStructure: Array<{type:"file"|"folder"|"pdf"|"image", name:string}>; // This is just example type
}

/**
 * Screen for viewing databank
 */
class DatabankScreen extends React.Component<Props, State> {

  /**
   * Class constructor
   */
  constructor(props:Props) {
    super(props);
    this.state = {
      exampleFolderStructure: [],
      path: ""
    }
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
            name='arrow-down-left'
            color='#fff'
            size={ 40 }
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
    }
  };

  /**
   * Component did mount life-cycle event
   */
  componentDidMount() {
    // make api call here
    this.setState({
      exampleFolderStructure:[
        {
          type: 'folder',
          name: 'folder 1'
        },
        {
          type: 'folder',
          name: 'folder 2'
        },
        {
          type: 'folder',
          name: 'folder 3'
        },
        {
          type: 'folder',
          name: 'folder 4'
        },
        {
          type: 'file',
          name: 'file 5'
        },
        {
          type: 'pdf',
          name: 'pdf 1'
        },
        {
          type: 'image',
          name: 'image 1'
        },
      ]
    });
  }

  /**
   * Component did update life-cycle event
   */
  componentDidUpdate(prevProps: Props, prevState: State) {
    const { path } = this.state;
    if (prevState.path !== path) {
      // make api call here
    }
  }

  /**
   * Component render
   */
  public render() {
    return (
      <Container>
        { this.state.path.length > 0 &&
          <Fab
            containerStyle={{  }}
            style={{ backgroundColor: '#E51D2A', zIndex:1 }}
            position="topRight"
            onPress={ this.moveBackToFolder }>
            <Icon name="arrow-back" iconStyle={{ color: "#fff" }} />
          </Fab>
        }
        { this.renderBreadcrumb() }
        <BasicScrollLayout navigation={ this.props.navigation } backgroundColor="#fff" displayFooter={ true }>
          { this.renderFolderStructure() }
        </BasicScrollLayout>
      </Container>
    );
  }

  /**
   * Renders breadcrumb
   */
  private renderBreadcrumb = () => {
    const { path } = this.state;
    const locations = path.split("/");
    return (
      <View style={{ padding: 10, borderBottomColor: "#000", borderBottomWidth: 1 }}>
        <Text style={{ fontSize: 15 }}>{`/ ${ (locations.length > 2) ? "... / " : "" }${ (locations.length > 1) ? `${ locations[locations.length - 2] } / ` : "" }${ (locations.length) ? locations[locations.length - 1] : "" }`}</Text>
      </View>
    );
  }

  /**
   * Renders folder structure
   */
  private renderFolderStructure = () => {
    const { exampleFolderStructure } = this.state;
    if (!exampleFolderStructure) {
      return null;
    }
    return exampleFolderStructure.map((item, index) => {
      return (
        <TouchableHighlight onPress={ (item.type === "folder") ? () => { this.moveToFolder(item.name) } : () => { this.downloadFile() } }>
          <View key={ index } style={{ display: "flex", flexDirection: "row", height: 70, padding: 10, borderBottomWidth: 1, borderBottomColor: "#000", backgroundColor: "#fff" }}>
            { item.type !== "folder" && <Image source={ this.getImage(item.type) } style={{ flex: 1, height: undefined, width: undefined, marginRight: 10 }} resizeMode="contain" /> }
            { item.type === "folder" && <Icon name='folder' color={ "#e01e37" } iconStyle={{ fontSize: 32, marginRight: 10 }} /> }
            <Text style={{ flex: 9, fontSize: 25, textAlignVertical: "center" }}>{ item.name }</Text>
          </View>
        </TouchableHighlight>
      )
    });
  }

  /**
   * Sets path to the given folder
   * 
   * @param name name of the folder
   */
  private moveToFolder = (name: string) => {
    const { path } = this.state;
    this.setState({
      path: path ? `${ path }/${ name }` : name
    });
  }

  /**
   * Sets path to parent folder
   */
  private moveBackToFolder = () => {
    const { path } = this.state;
    const locations = path.split("/");
    locations.pop();
    this.setState({
      path: locations.join("/")
    });
  }

  /**
   * Downloads a file to the users phone
   */
  private downloadFile = () => {

  }

  /**
   * Returns the correct image for item type
   * 
   * @param type type of the item
   */
  private getImage = (type: string) => {
    switch(type) {
      case "file": {
        return DEFAULT_FILE;
      }
      case "pdf": {
        return PDF_FILE;
      }
      case "image": {
        return IMAGE_FILE;
      }
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DatabankScreen);