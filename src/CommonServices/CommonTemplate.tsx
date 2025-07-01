//Default imports:
import * as React from "react";
// PrimeReact imports:
import { OverlayPanel } from "primereact/overlaypanel";

export const overlaypanelFunc = ({ selectedUser, op }) => {
  return (
    <div>
      <OverlayPanel ref={op}>
        <div className="selectedUserContainer">
          <div className="selectedUserImageContainer">
            <img src={selectedUser?.data?.imageUrl} alt="No image" />
          </div>
          <div className="selectedUserDetails">
            <p>
              <strong className="sideHeading">Name:</strong>
              {selectedUser?.data?.name}
            </p>
            <p>
              <strong className="sideHeading">Email:</strong>
              {selectedUser?.data?.email}
            </p>
          </div>
        </div>
      </OverlayPanel>
    </div>
  );
};
