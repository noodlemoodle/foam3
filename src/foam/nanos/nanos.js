/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

FOAM_FILES([
  { name: "foam/nanos/auth/Address" },
  { name: "foam/nanos/auth/ChangePassword" },
  { name: "foam/nanos/auth/EnabledAware", flags: ['js'] },
  { name: "foam/nanos/auth/EnabledAwareInterface", flags: ['java'] },
  { name: "foam/nanos/auth/Group" },
  { name: "foam/nanos/auth/Language" },
  { name: "foam/nanos/auth/LastModifiedAware", flags: ['js'] },
  { name: "foam/nanos/auth/LastModifiedAwareInterface", flags:['java']  },
  { name: "foam/nanos/auth/LastModifiedByAware", flags: ['js'] },
  { name: "foam/nanos/auth/LastModifiedByAwareInterface", flags: ['java'] },
  { name: "foam/nanos/auth/Login" },
  { name: "foam/nanos/auth/Permission" },
  { name: "foam/nanos/auth/Country" },
  { name: "foam/nanos/auth/Region" },
  { name: "foam/nanos/auth/User" },
  { name: "foam/nanos/boot/NSpec" },
  { name: "foam/nanos/client/ClientBuilder" },
  { name: "foam/nanos/menu/AbstractMenu" },
  { name: "foam/nanos/menu/DAOMenu" },
  { name: "foam/nanos/menu/ListMenu" },
  { name: "foam/nanos/menu/Menu" },
  { name: "foam/nanos/menu/MenuBar" },
  { name: "foam/nanos/menu/PopupMenu" },
  { name: "foam/nanos/menu/SubMenu" },
  { name: "foam/nanos/menu/SubMenuView" },
  { name: "foam/nanos/menu/TabsMenu" },
  { name: "foam/nanos/menu/ViewMenu" },
  { name: "foam/nanos/script/Language" },
  { name: "foam/nanos/script/Script" },
  { name: "foam/nanos/test/Test" },
  { name: "foam/nanos/test/TestBorder" },
  { name: "foam/nanos/cron/Cron" },
  { name: "foam/nanos/export/ExportDriverRegistry"},
  { name: "foam/nanos/export/ExportDriver" },
  { name: "foam/nanos/export/JSONDriver"},
  { name: "foam/nanos/export/XMLDriver"},
  { name: "foam/nanos/export/CSVDriver"},
  { name: "foam/nanos/auth/Relationships" },
  { name: "foam/nanos/NanoService" },
  { name: "foam/nanos/auth/WebAuthService" },
  { name: "foam/nanos/auth/ClientAuthService" },
  { name: "foam/nanos/pm/PMInfo" },
  { name: "foam/nanos/pm/PMTableView", flags:['web'] },
  { name: "foam/nanos/pm/TemperatureCView" }
]);
