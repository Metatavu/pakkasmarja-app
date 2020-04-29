import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import FeatherIcon from "react-native-vector-icons/Feather";
import { StoreState, AccessToken } from "../../../types";
import { View, TouchableHighlight, Image, Alert, Platform } from "react-native";
import { ItemGroup, SharedFile, FileType } from "pakkasmarja-client";
import * as actions from "../../../actions";
import TopBar from "../../layout/TopBar";
import { Text, Fab, Container, Toast } from "native-base";
import { DEFAULT_FILE, PDF_FILE, IMAGE_FILE } from '../../../static/images/';
import RNFetchBlob from 'rn-fetch-blob'
import { Icon } from 'react-native-elements'
import PakkasmarjaApi from "../../../api";
import { REACT_APP_API_URL } from 'react-native-dotenv';

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
   * Files and folders that will be rendered
   */
  sharedFiles: SharedFile[];
  error?:any
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
      sharedFiles: [],
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
            name='chevron-left'
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
    this.updateSharedFiles();
  }

  /**
   * Component did update life-cycle event
   */
  componentDidUpdate(prevProps: Props, prevState: State) {
    const { path } = this.state;
    if (prevState.path !== path) {
      this.updateSharedFiles();
    }
  }

  /**
   * Component render
   */
  public render() {
    return (
      <Container>
        { this.renderBreadcrumb() }
        <BasicScrollLayout navigation={ this.props.navigation } backgroundColor="#fff" displayFooter={ true }>
          { this.renderFolderStructure() }
        </BasicScrollLayout>
        { this.state.path.length > 0 &&
          <Fab
            style={{ backgroundColor: '#E51D2A' }}
            position="topRight"
            onPress={ this.moveBackToFolder }>
            <Icon name="arrow-back" iconStyle={{ color: "#fff" }} />
          </Fab>
        }
      </Container>
    );
  }

  /**
   * Updates shared files
   */
  private updateSharedFiles = async () => {
    const { accessToken } = this.props;
    const { path } = this.state;
    if (!accessToken || !accessToken.access_token) {
      return;
    }
    try {
      const api = new PakkasmarjaApi();
      const sharedFiles = await api.getSharedFilesService(accessToken.access_token).listSharedFiles(path ? `${path}/` : undefined);
      if (Array.isArray(sharedFiles)) {
        this.setState({
          sharedFiles: sharedFiles.map((file) => {
            return {...file, name: file.name.replace(/\//g, "")}
          })
          .sort((a, b) => {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          })
          .sort((a, b) => {
            return Number(b.fileType === "FOLDER") - Number(a.fileType === "FOLDER");
          })
        });
      }
    } catch (error) {
      // error
    }
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
    const { sharedFiles } = this.state;
    if (!sharedFiles) {
      return null;
    }
    return sharedFiles.map((item, index) => {
      return (
        <TouchableHighlight key={ index } onPress={ (item.fileType === "FOLDER") ? () => { this.moveToFolder(item.name) } : () => { this.downloadFile(item) } }>
          <View key={ index } style={{ display: "flex", flexDirection: "row", height: 70, padding: 10, borderBottomWidth: 1, borderBottomColor: "#000", backgroundColor: "#fff" }}>
            { item.fileType !== "FOLDER" && <Image source={ this.getImage(item.fileType) } style={{ flex: 1, height: undefined, width: undefined, marginRight: 10 }} resizeMode="contain" /> }
            { item.fileType === "FOLDER" && <Icon name='folder' color={ "#e01e37" } iconStyle={{ fontSize: 32, marginRight: 10 }} /> }
            <Text style={{ flex: 9, fontSize: 25, textAlignVertical: "center", textTransform: "capitalize" }}>{ item.name }</Text>
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
   * Resolves mime type for file
   */
  private resolveMimeType = (file: SharedFile): string => {
    switch (file.fileType) {
      case FileType.IMAGE:
        return this.resolveImageType(file);
      case FileType.PDF:
        return "application/pdf";
      case FileType.OTHER:
        return this.resolveOtherType(file);
      default:
        return "application/octet-stream";
    }
  }

  /**
   * Resolves mime type for image file
   */
  private resolveImageType = (file: SharedFile): string => {
    const filename = file.name.trim();
    if (filename.endsWith(".png")) {
      return "image/png";
    } else if(filename.endsWith(".jpg")) {
      return "image/jpeg";
    } else if(filename.endsWith(".jpeg")) {
      return "image/jpeg";
    }

    return "image/png";
  }

  /**
   * Resolves mime type for other files
   */
  private resolveOtherType = (file: SharedFile): string => {
    const filename = file.name.trim();
    if (filename.endsWith(".doc")) {
      return "application/msword";
    } else if(filename.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if(filename.endsWith(".csv")) {
      return "text/csv";
    } else if(filename.endsWith(".ppt")) {
      return "application/vnd.ms-powerpoint";
    } else if(filename.endsWith(".pptx")) {
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if(filename.endsWith(".xls")) {
      return "application/vnd.ms-excel";
    } else if(filename.endsWith(".xlsx")) {
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if(filename.endsWith(".zip")) {
      return "application/zip";
    } 

    return "application/octet-stream";
  }

  /**
   * Tries to guess file extension if not provided
   */
  private createFilenameWithExtension = (file: SharedFile) => {
    const fileName = file.name;
    if (fileName.indexOf(".") > -1) {
      return fileName;
    }

    switch (file.fileType) {
      case FileType.IMAGE:
        return `${fileName}.png`;
      case FileType.PDF:
        return `${fileName}.pdf`;
      default:
        return fileName;
    }

  }

  /**
   * Downloads a file
   * 
   * @param file shared file
   */
  private downloadFile = async (file: SharedFile) => {
    const { accessToken } = this.props;
    if (!accessToken || !accessToken.access_token) {
      return;
    }
    try {
        RNFetchBlob.config({
          fileCache : Platform.OS == "ios" ? false : true,
          addAndroidDownloads : {
            path: RNFetchBlob.fs.dirs.DownloadDir + "/" + file.name,
            useDownloadManager : true,
            notification : true,
            mime : this.resolveMimeType(file),
            mediaScannable : true,
            title : `${file.name} ladattu onnistuneesti`,
            description : 'Tiedosto ladattu Pakkasmarjan tietopankista'
          },
        }).fetch("GET",`${REACT_APP_API_URL}/rest/v1/sharedFiles/download?${file.pathPrefix ? "pathPrefix=" + file.pathPrefix.replace(/\//g, "%2F") + "&" : ""}fileName=${file.name}`, {
          'Authorization': `Bearer ${accessToken.access_token}`
        }).then(async (res) => {
          Toast.show({
            type: "success",
            text: "Tiedosto ladattu"
          });
          if (Platform.OS == "ios") {
            const filePath = `${RNFetchBlob.fs.dirs.DocumentDir}/${this.createFilenameWithExtension(file)}`;
            const data = await res.base64();
            await RNFetchBlob.fs.writeFile(filePath, data, "base64");
            RNFetchBlob.ios.openDocument(filePath);
          }
        });
    } catch (error) {
      Toast.show({
        type: "danger",
        text: "Tiedoston lataus epäonnistui"
      });
    } 
  }

  /**
   * Returns the correct image for item type
   * 
   * @param type type of the item
   */
  private getImage = (type: string) => {
    switch(type) {
      case "OTHER": {
        return DEFAULT_FILE;
      }
      case "PDF": {
        return PDF_FILE;
      }
      case "IMAGE": {
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