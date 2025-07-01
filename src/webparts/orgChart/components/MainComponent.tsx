//Default imports:
import * as React from "react";
import { useEffect, useState, useRef } from "react";
//Styles imports:
import "../../../External/style.css";
//PrimeReact imports:
import { OrganizationChart } from "primereact/organizationchart";
import { TreeNode } from "primereact/treenode";
//PeoplePicker imports:
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { NormalPeoplePicker } from "@fluentui/react/lib/Pickers";
//Common Services imports:
import { Config } from "../../../CommonServices/Config";
import SPServices from "../../../CommonServices/SPServices";
import { IPeoplePickerDetails } from "../../../CommonServices/interface";
import { overlaypanelFunc } from "../../../CommonServices/CommonTemplate";
import { graph } from "@pnp/graph/presets/all";
import { IPersonaProps } from "@fluentui/react";

const MainComponent = ({ context }) => {
  //State variables:
  const [userdetails, setUserDetails] = useState<TreeNode[]>([]);
  const [selectedUser, setSelectedUser] = useState(null);
  console.log(selectedUser, "selectedUser");
  const [fullData, setFullData] = useState([]);
  const [peopleList, setPeopleList] = useState<IPeoplePickerDetails[]>([]);
  const loginUser = context?._pageContext?._user?.email;
  const op = useRef(null);

  const getEmployeeDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.EmployeeOrgList,
      Select:
        "*,Employee/Id,Employee/Title,Employee/EMail,Members/Id,Members/Title,Members/EMail,ProjectManager/Id,ProjectManager/Title,ProjectManager/EMail",
      Expand: "Employee,Members,ProjectManager",
      Orderby: "Modified",
      Orderbydecorasc: false,
    })
      .then((res: any) => {
        const tempUsersData = [];
        res.forEach((item: any) => {
          console.log(item, "item");
          let _ProjectManager: IPeoplePickerDetails[] = [];
          _ProjectManager.push({
            id: item?.ProjectManager?.Id,
            name: item?.ProjectManager?.Title,
            email: item?.ProjectManager?.EMail,
          });
          let _Employee: IPeoplePickerDetails[] = [];
          _Employee.push({
            id: item?.Employee?.Id,
            name: item?.Employee?.Title,
            email: item?.Employee?.EMail,
          });
          let _Members: IPeoplePickerDetails[] = [];
          item?.Members?.forEach((member: any) => {
            _Members.push({
              id: member?.Id,
              name: member?.Title,
              email: member?.EMail,
            });
          });
          tempUsersData.push({
            projectManager: _ProjectManager,
            Employee: _Employee,
            Members: _Members,
          });
        });
        setFullData(tempUsersData);
        const treeData = buildTreeData(tempUsersData, loginUser);
        setUserDetails(treeData);
        getallusers();
      })
      .catch((err) => {
        SPServices.ErrFunction("org err", err);
      });
  };

  const getallusers = () => {
    graph.users
      .top(999)
      .select()
      .filter("accountEnabled eq true")
      .get()
      .then(function (data) {
        const users = [];
        for (let i = 0; i < data.length; i++) {
          users.push({
            id: data[i].id,
            name: data[i].displayName,
            email: data[i].mail,
          });
        }
        setPeopleList([...users]);
      })
      .catch(function (error) {
        SPServices.ErrFunction("org err", error);
      });
  };

  // Build the TreeNode[] structure based on login user:
  const buildTreeData = (employeeList, loginUser: string) => {
    const loggedUserObj = employeeList.find(
      (emp: any) =>
        emp.Employee?.[0]?.email?.toLowerCase() === loginUser?.toLowerCase()
    );

    if (!loggedUserObj) return []; // Not found as Employee

    const loginEmp = loggedUserObj.Employee?.[0];
    const projectManager = loggedUserObj.projectManager?.[0];
    const members = loggedUserObj.Members || [];

    // Build member nodes
    const memberNodes: TreeNode[] = members.map((member) => ({
      label: member?.name,
      data: {
        name: member?.name,
        email: member?.email,
        imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${member?.email}`,
      },
    }));

    // Build login user node
    const loginUserNode: TreeNode = {
      label: loginEmp?.name,
      data: {
        name: loginEmp?.name,
        email: loginEmp?.email,
        imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${loginEmp?.email}`,
      },
      expanded: true,
      children: memberNodes,
    };

    if (projectManager?.email) {
      return [
        {
          label: projectManager?.name,
          data: {
            name: projectManager.name,
            email: projectManager.email,
            imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${projectManager?.email}`,
            title: "Manager",
          },
          expanded: true,
          children: [loginUserNode],
        },
      ];
    }

    return [loginUserNode];
  };

  //Template for rendering each node in the org chart:
  const nodeTemplate = (node: TreeNode) => {
    const { name, imageUrl, title } = node.data || {};
    return (
      <div className="nodeTemplateContainer">
        {/* <img src={imageUrl} alt={name} /> */}
        <div>
          <span>{name}</span>
          {title && (
            <div style={{ marginTop: "10px" }}>
              <span className="nodeTitle">{title}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  //Handle user search from PeoplePicker:
  const handleUserSearch = (items: any[]) => {
    if (!items?.length) {
      // Reset to login user's org
      const treeData = buildTreeData(fullData, loginUser);
      setUserDetails(treeData);
      return;
    }

    const selectedEmail = items[0]?.secondaryText;
    const userObj = fullData.find(
      (emp: any) =>
        emp.Employee?.[0]?.email?.toLowerCase() === selectedEmail?.toLowerCase()
    );

    if (userObj) {
      const treeData = buildTreeData(fullData, selectedEmail);
      setUserDetails(treeData);
    } else {
      setUserDetails([
        {
          label: "No records found",
          data: {
            name: "No data",
          },
        },
      ]);
    }
  };

  //Resolve suggestions for PeoplePicker Only for Azure AD users:
  const onFilterChanged = (filterText: string, currentPersonas: any[]) => {
    if (!filterText) return [];

    const filtered = peopleList
      .filter((user) =>
        user?.name?.toLowerCase().includes(filterText.toLowerCase())
      )
      .map((user) => ({
        key: user.id,
        primaryText: user.name,
        secondaryText: user.email,
      }));

    return Promise.resolve(filtered);
  };

  function getTextFromItem(persona: IPersonaProps): string {
    return persona.text as string;
  }

  //Initial Render:
  useEffect(() => {
    getEmployeeDetails();
  }, []);

  return (
    <>
      <div className="card overflow-x-auto">
        <h2 className="OrgHeading">Organization Chart</h2>
        <div>
          <NormalPeoplePicker
            onResolveSuggestions={onFilterChanged}
            getTextFromItem={getTextFromItem}
            className={"ms-PeoplePicker"}
            key={"normal"}
            pickerSuggestionsProps={{
              suggestionsHeaderText: "Suggested People",
            }}
            inputProps={{ placeholder: "Search User" }}
            selectionAriaLabel={"Selected contacts"}
            removeButtonAriaLabel={"Remove"}
            resolveDelay={300}
            itemLimit={1}
            onChange={(data) => handleUserSearch(data)}
          />
        </div>
        {userdetails.length > 0 && (
          <OrganizationChart
            value={userdetails}
            nodeTemplate={nodeTemplate}
            selectionMode="single"
            onNodeSelect={(e) => {
              setSelectedUser(e.node);
              op.current.toggle(e.originalEvent);
            }}
          />
        )}
      </div>
      {selectedUser?.data?.name !== "No data"
        ? overlaypanelFunc({ selectedUser, op })
        : ""}
    </>
  );
};

export default MainComponent;
