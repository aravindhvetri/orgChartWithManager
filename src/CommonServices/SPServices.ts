import { sp } from "@pnp/sp/presets/all";
import {
  IFilter,
  IListItems,
  IListItemUsingId,
  IAddList,
  IUpdateList,
  ISPList,
  IDetailsListGroup,
  ISPAttachment,
  IAttachDelete,
  ISPListChoiceField,
  IGetDocLibFiles,
  IDocFiles,
  IAddDocLibFiles,
  IInsertFiles,
  IRemoveFiles,
} from "./ISPServicesProps";
import { IItemAddResult } from "@pnp/sp/items";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";
// import { toast } from "react-toastify";

const getAllUsers = async (): Promise<[]> => {
  return await sp.web.siteUsers();
};
const getCurrentUsers = async (): Promise<[]> => {
  return await sp.web.currentUser();
};

const SPAddItem = async (params: IAddList): Promise<IItemAddResult> => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.add(params.RequestJSON);
};

const SPUpdateItem = async (params: IUpdateList): Promise<IItemAddResult> => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.getById(params.ID)
    .update(params.RequestJSON);
};

const SPDeleteItem = async (params: ISPList): Promise<void> => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.getById(params.ID)
    .delete();
};

const SPReadItems = async (params: IListItems): Promise<[]> => {
  params = formatInputs(params);
  let filterValue: string = formatFilterValue(
    params.Filter,
    params.FilterCondition ? params.FilterCondition : ""
  );

  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.select(params.Select)
    .filter(filterValue)
    .expand(params.Expand)
    .top(params.Topcount)
    .orderBy(params.Orderby, params.Orderbydecorasc)
    .get();
};

const SPReadItemUsingId = async (params: IListItemUsingId): Promise<[]> => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.getById(params.SelectedId)
    .select(params.Select)
    .expand(params.Expand)
    .get();
};
const SPReadItemUsingID = async (params: IListItemUsingId): Promise<[]> => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.getById(params.SelectedId)
    .get();
};
const SPReadItemVersionHistory = async (
  params: IListItemUsingId
): Promise<[]> => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .items.getById(params.SelectedId)
    .versions.select(params.Select)
    .expand(params.Expand)
    .get();
};

const SPAddAttachments = async (params: ISPAttachment) => {
  const files: any[] = params.Attachments;
  return await sp.web.lists
    .getByTitle(params.ListName)
    .items.getById(params.ListID)
    .attachmentFiles.addMultiple(files);
};

const SPGetAttachments = async (params: ISPList) => {
  const item: any = sp.web.lists
    .getByTitle(params.Listname)
    .items.getById(params.ID);
  return await item.attachmentFiles();
};

const SPDeleteAttachments = async (params: IAttachDelete) => {
  return await sp.web.lists
    .getByTitle(params.ListName)
    .items.getById(params.ListID)
    .attachmentFiles.getByName(params.AttachmentName)
    .delete();
};

const SPGetChoices = async (params: ISPListChoiceField) => {
  return await sp.web.lists
    .getByTitle(params.Listname)
    .fields.getByInternalNameOrTitle(params.FieldName)
    .get();
};

const getDocLibFiles = async (params: IGetDocLibFiles): Promise<object[]> => {
  let FilesArr: IDocFiles[] = [];
  await sp.web
    .getFolderByServerRelativePath(params.FilePath)
    .files.get()
    .then((DocRes) => {
      if (DocRes.length) {
        DocRes.forEach((item) => {
          FilesArr.push({
            name: item.Name,
            content: item.ServerRelativeUrl,
            type: "Inlist",
          });
        });
      }
    })
    .catch((err) => ErrFunction("Get Document Library Files", err));
  return FilesArr;
};

const addDocLibFiles = async (params: IAddDocLibFiles) => {
  let getFilePath: string = params.FilePath;
  let delAttachments: IDocFiles[] = [];
  let addAttachments: IDocFiles[] = [];
  if (params.Datas.length) {
    delAttachments = params.Datas.filter((files: IDocFiles) => {
      return files.type == "Delete";
    });

    addAttachments = params.Datas.filter((files: IDocFiles) => {
      return files.type == "New";
    });
  }
  if (params.FolderNames.length) {
    for (let j: number = 0; j < params.FolderNames.length; j++) {
      await sp.web
        .getFolderByServerRelativePath(getFilePath)
        .folders.addUsingPath(params.FolderNames[j], true)
        .then(async (res) => {
          getFilePath = res.data.ServerRelativeUrl;
          if (j === params.FolderNames.length - 1 && delAttachments.length) {
            for (let k: number = 0; k < delAttachments.length; k++) {
              await sp.web
                .getFolderByServerRelativePath(getFilePath)
                .files.getByName(delAttachments[k].name)
                .delete()
                .then(async (res: any) => {
                  if (
                    addAttachments.length &&
                    delAttachments.length - 1 === k
                  ) {
                    for (let i: number = 0; i < addAttachments.length; i++) {
                      await sp.web
                        .getFolderByServerRelativePath(getFilePath)
                        .files.addUsingPath(
                          addAttachments[i].name,
                          addAttachments[i].content,
                          {
                            Overwrite: true,
                          }
                        )
                        .then((file: any) => {})
                        .catch((error) => {
                          ErrFunction("Error creating file", error);
                        });
                    }
                  }
                })
                .catch((error) => {
                  ErrFunction("Delete  attachements", error);
                });
            }
          } else if (
            j === params.FolderNames.length - 1 &&
            addAttachments.length
          ) {
            for (let z: number = 0; z < addAttachments.length; z++) {
              await sp.web
                .getFolderByServerRelativePath(getFilePath)
                .files.addUsingPath(
                  addAttachments[z].name,
                  addAttachments[z].content,
                  {
                    Overwrite: true,
                  }
                )
                .then((file: any) => {})
                .catch((error) => {
                  ErrFunction("Error creating file", error);
                });
            }
          }
        })
        .catch((err) => ErrFunction("creating folder", err));
    }
  } else {
    getFilePath = params.FilePath;
    if (delAttachments.length) {
      for (let i: number = 0; i < delAttachments.length; i++) {
        await sp.web
          .getFolderByServerRelativePath(getFilePath)
          .files.getByName(delAttachments[i].name)
          .delete()
          .then(async (res: any) => {
            if (addAttachments.length && delAttachments.length - 1 === i) {
              for (let j: number = 0; j < addAttachments.length; j++) {
                await sp.web
                  .getFolderByServerRelativePath(getFilePath)
                  .files.addUsingPath(
                    addAttachments[j].name,
                    addAttachments[j].content,
                    {
                      Overwrite: true,
                    }
                  )
                  .then((file: any) => {})
                  .catch((error) => {
                    ErrFunction("Error creating file", error);
                  });
              }
            }
          })
          .catch((error) => ErrFunction("Delete attachements", error));
      }
    } else if (addAttachments.length) {
      for (let i: number = 0; i < addAttachments.length; i++) {
        await sp.web
          .getFolderByServerRelativePath(params.FilePath)
          .files.addUsingPath(
            addAttachments[i].name,
            addAttachments[i].content,
            {
              Overwrite: true,
            }
          )
          .then((file: any) => {})
          .catch((error) => {
            ErrFunction("Error creating file", error);
          });
      }
    }
  }

  return getFilePath ? getDocLibFiles({ FilePath: getFilePath }) : [];
  // return getFilePath
};

const fileInsert = (params: IInsertFiles) => {
  if (params.files.length) {
    let insertFile: IDocFiles[] = [...params.data];
    for (let i = 0; i < params.files.length; i++) {
      if (
        ![...insertFile].some((values) => {
          return (
            values.name == params.files[i].name && values.type !== "Delete"
          );
        })
      )
        insertFile.push({
          name: params.files[i].name,
          content: params.files[i],
          type: "New",
        });
    }
    return insertFile;
  }
};

const fileRemove = (params: IRemoveFiles) => {
  let removefiles: IDocFiles[] = [...params.data];
  let item = removefiles[params.index];
  if (item.type == "Inlist") {
    removefiles[params.index] = { ...item, ["type"]: "Delete" };
  } else if (item.type == "New") {
    removefiles.splice(params.index, 1);
  }
  return removefiles;
};

const SPDetailsListGroupItems = async (params: IDetailsListGroup) => {
  let newRecords = [];
  params.Data.forEach((arr, index) => {
    newRecords.push({
      Lesson: arr[params.Column],
      indexValue: index,
    });
  });

  let varGroup = [];
  let UniqueRecords = newRecords.reduce(function (item, e1) {
    var matches = item.filter(function (e2) {
      return e1[params.Column] === e2[params.Column];
    });

    if (matches.length == 0) {
      item.push(e1);
    }
    return item;
  }, []);

  UniqueRecords.forEach((ur) => {
    let recordLength = newRecords.filter((arr) => {
      return arr[params.Column] == ur[params.Column];
    }).length;
    varGroup.push({
      key: ur[params.Column],
      name: ur[params.Column],
      startIndex: ur.indexValue,
      count: recordLength,
    });
  });
  return varGroup;
};

const batchInsert = async (params: {
  ListName: string;
  responseData: any[];
}): Promise<any> => {
  const list = sp.web.lists.getByTitle(params.ListName);
  const batch = sp.web.createBatch();
  const promises: any[] = [];

  for (const data of params.responseData) {
    const promise = list.items.inBatch(batch).add(data);
    promises.push(promise);
  }

  await batch
    .execute()
    .then(() => {
      return promises;
    })
    .catch((error) => ErrFunction("Batch insert", error));
};

const batchUpdate = async (params: {
  ListName: string;
  responseData: any[];
}): Promise<any> => {
  const list = sp.web.lists.getByTitle(params.ListName);
  const batch = sp.web.createBatch();
  const promises = [];

  for (const data of params.responseData) {
    const promise = list.items.getById(data.ID).inBatch(batch).update(data);
    promises.push(promise);
  }

  await batch
    .execute()
    .then(() => {
      return promises;
    })
    .catch((error) => ErrFunction("Batch update", error));
};

const batchDelete = async (params: {
  ListName: string;
  responseData: any[];
}): Promise<any> => {
  const list = sp.web.lists.getByTitle(params.ListName);
  const batch = sp.web.createBatch();
  const promises = [];

  for (const data of params.responseData) {
    const promise = list.items.getById(data.ID).inBatch(batch).delete();
    promises.push(promise);
  }

  await batch
    .execute()
    .then(() => {
      return promises;
    })
    .catch((error) => ErrFunction("Batch delete", error));
};

const formatInputs = (data: IListItems): IListItems => {
  !data.Select ? (data.Select = "*") : "";
  !data.Topcount ? (data.Topcount = 5000) : "";
  !data.Orderby ? (data.Orderby = "ID") : "";
  !data.Expand ? (data.Expand = "") : "";
  !data.Orderbydecorasc == true && !data.Orderbydecorasc == false
    ? (data.Orderbydecorasc = true)
    : "";
  !data.PageCount ? (data.PageCount = 10) : "";
  !data.PageNumber ? (data.PageNumber = 1) : "";

  return data;
};

const formatFilterValue = (
  params: IFilter[],
  filterCondition: string
): string => {
  let strFilter: string = "";
  if (params) {
    for (let i = 0; i < params.length; i++) {
      if (params[i].FilterKey) {
        if (i != 0) {
          if (filterCondition == "and" || filterCondition == "or") {
            strFilter += " " + filterCondition + " ";
          } else {
            strFilter += " and ";
          }
        }

        if (
          params[i].Operator.toLocaleLowerCase() == "eq" ||
          params[i].Operator.toLocaleLowerCase() == "ne" ||
          params[i].Operator.toLocaleLowerCase() == "gt" ||
          params[i].Operator.toLocaleLowerCase() == "lt" ||
          params[i].Operator.toLocaleLowerCase() == "ge" ||
          params[i].Operator.toLocaleLowerCase() == "le"
        )
          strFilter +=
            params[i].FilterKey +
            " " +
            params[i].Operator +
            "'" +
            params[i].FilterValue +
            "'";
        else if (params[i].Operator.toLocaleLowerCase() == "substringof")
          strFilter +=
            params[i].Operator +
            "('" +
            params[i].FilterKey +
            "','" +
            params[i].FilterValue +
            "')";
      }
    }
  }
  return strFilter;
};

const decimalCount = (number: number): number => {
  let num: any = number ? number : 0;
  num = num.toFixed(2);

  return Number(num);
};

const format = (number: number): string => {
  let num: any = number ? number : 0;
  num = num.toLocaleString("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return num;
};

const numberFormat = (number: string) => {
  let string: any = number;
  if (string.length > 1) {
    string = number.split("");

    for (let i = 0; i < number.length; i++) {
      if (number[i] === "0" && number[i + 1] !== ".") {
        string.shift();
      } else {
        i = number.length;
      }
    }

    string = string ? string.join("") : "0";
  }
  return string;
};

const ErrFunction = (errType: string, errMsg: any) => {
  console.log(errType, errMsg);
};

export default {
  ErrFunction,
  getAllUsers,
  getCurrentUsers,
  SPAddItem,
  SPUpdateItem,
  SPDeleteItem,
  SPReadItems,
  SPDetailsListGroupItems,
  SPGetChoices,
  SPAddAttachments,
  SPGetAttachments,
  SPDeleteAttachments,
  SPReadItemUsingId,
  batchInsert,
  batchUpdate,
  batchDelete,
  decimalCount,
  format,
  numberFormat,
  getDocLibFiles,
  addDocLibFiles,
  fileInsert,
  fileRemove,
  SPReadItemUsingID,
  SPReadItemVersionHistory,
};
