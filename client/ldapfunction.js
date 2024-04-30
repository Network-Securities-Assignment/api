const ldap = require('ldapjs');

class LDAP {

  constructor(url) {
    this.client = ldap.createClient({ url });
  }

  authenticateDN(username, password, callback) {
    this.client.bind(username, password, (err) => {
      if (err) {
        console.log("Error in new connection " + err);
        callback(err);
      } else {
        console.log("Authenticate successfully!");
        callback(null);
      }
    });
  }

  searchUser(username, callback) {
    console.log(username)
    const opts = {
      filter: `(cn=${username})`,
      scope: 'sub',
      attributes: ['cn', 'sn', 'givenName', 'uidNumber', 'gidNumber', 'mail', 'username']
    };

    this.client.search('ou=users,dc=netsecurityass,dc=com', opts, (err, res) => {
      if (err) {
        console.log("Error in search " + err);
        callback(err, null);
      } else {
        let user = null;
        res.on('searchEntry', (entry) => {
          console.log("Search successfully!");
          const userData = entry.pojo
          user = {
            username: userData.attributes.find(attr => attr.type === 'cn').values[0],
            info: userData.attributes.reduce((obj, item) => {
              obj[item.type] = item.values;
              return obj;
            }, {})
          };
        });
        res.on('searchReference', (referral) => {
          console.log('Referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('Error: ' + err.message);
          callback(err, null);
        });
        res.on('end', (result) => {
          console.log('Status: ' + result.status);
          callback(null, user);
        });
      }
    });
  }

  searchGroup(groupName, callback) {
    console.log(groupName)
    const opts = {
      filter: `(cn=${groupName})`,
      scope: 'sub',
      attributes: ['cn', 'memberUid', 'gidNumber']
    };

    this.client.search('ou=groups,dc=netsecurityass,dc=com', opts, (err, res) => {
      if (err) {
        console.log("Error in search " + err);
        callback(err, null);
      } else {
        let group = null;
        res.on('searchEntry', (entry) => {
          console.log("Search successfully!");
          const groupData = entry.pojo
          group = {
            groupName: groupData.attributes.find(attr => attr.type === 'cn').values[0],
            info: groupData.attributes.reduce((obj, item) => {
              obj[item.type] = item.values;
              return obj;
            }, {})
          };
        });
        res.on('searchReference', (referral) => {
          console.log('Referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('Error: ' + err.message);
          callback(err, null);
        });
        res.on('end', (result) => {
          console.log('Status: ' + result.status);
          callback(null, group);
        });
      }
    });
  }

  searchAllUsers(callback) {
    const opts = {
      filter: '(objectClass=inetOrgPerson)',
      scope: 'sub',
      attributes: ['cn', 'sn', 'givenName', 'uidNumber', 'gidNumber', 'mail']
    };

    this.client.search('ou=users,dc=netsecurityass,dc=com', opts, (err, res) => {
      if (err) {
        console.log("Error in search " + err);
        callback(err, null);
      } else {
        const users = [];
        res.on('searchEntry', (entry) => {
          const userData = entry.pojo
          const user = {
            username: userData.attributes.find(attr => attr.type === 'cn').values[0],
            info: userData.attributes.reduce((obj, item) => {
              obj[item.type] = item.values;
              return obj;
            }, {})
          };
          // users.push(user);

          console.log("Search successfully!");
          users.push(user);
        });
        res.on('searchReference', (referral) => {
          console.log('Referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('Error: ' + err.message);
          callback(err, null);
        });
        res.on('end', (result) => {
          console.log('Status: ' + result.status);
          callback(null, users);
        });
      }
    });
  }

  searchAllGroups(callback) {
    const opts = {
      filter: '(objectClass=posixGroup)',
      scope: 'sub',
      attributes: ['cn', 'memberUid', 'gidNumber']
    };

    this.client.search('ou=groups,dc=netsecurityass,dc=com', opts, (err, res) => {
      if (err) {
        console.log("Error in search " + err);
        callback(err, null);
      } else {
        const groups = [];
        res.on('searchEntry', (entry) => {
          const groupData = entry.pojo.attributes
          console.log("Search successfully!");
          groups.push(groupData);
        });
        res.on('searchReference', (referral) => {
          console.log('Referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('Error: ' + err.message);
          callback(err, null);
        });
        res.on('end', (result) => {
          console.log('Status: ' + result.status);
          callback(null, groups);
        });
      }
    });
  }

  createUser(uidNumber, sn, givenName, gidNumber, mail, username, password, callback) {
    const dn = `cn=${username},ou=users,dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    const entry = {
      cn: username,
      sn: sn,
      givenName: givenName,
      uid: username,
      mail: mail,
      objectClass: ['inetOrgPerson', 'posixAccount', 'top'],
      userPassword: password,
      uidNumber: uidNumber,
      gidNumber: gidNumber,
      homeDirectory: `/home/${username}`
    };
    this.client.add(dn, entry, (err) => {
      if (err) {
        console.error('Error creating user:', err);
        return callback(err);
      } else {
        console.log('User created successfully');
        this.addUserToPosixGroup(username, gidNumber, (err) => {
          if(err) console.error('Error adding user to primary group:', err)
          else {
            console.log('User added to primary group successfully');
          }
        })
        return callback(null);
      }
    });
  }

  addUserToPosixGroup = (username, gidNumber, callback) => {
    // Find the group's DN based on gidNumber
    const userDN = `cn=${username},ou=users,dc=netsecurityass,dc=com`;

    const opts = {
        filter: `(gidNumber=${gidNumber})`,
        scope: 'sub',
        attributes: ['dn']
    };
    this.client.search('ou=groups,dc=netsecurityass,dc=com', opts, (err, res) => {
        if (err) {
            return callback(err);
        }

        let groupDn;
        res.on('searchEntry', (entry) => {
            groupDn = entry.objectName;
        });

        res.on('error', (err) => {
            callback(err);
        });

        res.on('end', (result) => {
            if (!groupDn) {
                return callback(new Error('Group not found'));
            }
            // Prepare the modification to add user to group
            const newUser = new ldap.Attribute({
              type: 'memberUid',
              values: `cn=${username}, ou=users, dc=netsecurityass, dc=com`
            });

            const change = new ldap.Change({
              operation: 'add',
              modification: newUser
            });
            // Modify group
            this.client.modify(groupDn, change, (err) => {
                if (err) {
                    callback(err);
                } else {
                    console.log(`User ${userDN} added to group ${groupDn} successfully`);
                    callback(null);
                }
            });
        });
    });
  };

  deleteUser(username, callback) {
    const userDN = `cn=${username},ou=users,dc=netsecurityass,dc=com`
    this.client.del(userDN, (err) => {
      if (err) {
        console.error('Error deleting user:', err);
        callback(err);
      } else {
        console.log('User deleted successfully');
        this.removeAllUserFromGroups(username, (err) => {
          if(err) 
            console.error('Error deleting user in group:', err);
          else{ 
            console.log('Remove user from group successfully')
          }
          callback(null);
        })
      }
    });
  }

  removeAllUserFromGroups(username, callback) {
    const userDn = `cn=${username}, ou=users, dc=netsecurityass, dc=com`
    const opts = {
        filter: `(memberUid=${userDn})`,  // Assuming the userDn is used as memberUid, adjust as needed
        scope: 'sub',
        attributes: ['cn']
    };

    this.client.search('ou=groups,dc=netsecurityass,dc=com', opts, (err, res) => {
        if (err) {
            return callback(err);
        }
        let changesApplied = 0;
        res.on('searchEntry', entry => {
          
            const groupDn = entry.dn.toString();
            console.log(groupDn)

            const deluser = new ldap.Attribute({
              type: 'memberUid',
              values: userDn
            });
            const change = new ldap.Change({
              operation: 'delete',
              modification: deluser
            });
            
            this.client.modify(groupDn, change, err => {
                if (err) {
                    console.error(`Failed to remove user from ${groupDn}:`, err);
                } else {
                    console.log(`User removed from ${groupDn} successfully.`);
                    changesApplied++;
                }
            });
        });

        res.on('error', err => {
            console.error('Search error:', err);
            callback(err);
        });

        res.on('end', result => {
            if (result.status !== 0) {
                console.error('Search did not complete successfully:', result);
                return callback(new Error('Search failed to complete'));
            }
            console.log(`Changes applied to ${changesApplied} groups.`);
            callback(null);
        });
    });
  }

  updateUser(username, userData, callback) {
    const dn = `cn=${username},ou=users,dc=netsecurityass,dc=com`;
    const changes = [];

    // Helper function to add change only if value is defined and not null
    const addChangeIfDefined = (attrType, value) => {
        if (value !== undefined && value !== null) {
            changes.push(new ldap.Change({
                operation: 'replace',
                modification: new ldap.Attribute({
                    type: attrType,
                    values: [value]  // Ensure the value is encapsulated in an array
                })
            }));
        }
    };

    // Using helper function to conditionally add changes
    // addChangeIfDefined('username', userData.username);
    addChangeIfDefined('mail', userData.mail);
    addChangeIfDefined('gidNumber', userData.gidNumber);
    addChangeIfDefined('userPassword', userData.userPassword);
    addChangeIfDefined('givenName', userData.givenName);
    addChangeIfDefined('uidNumber', userData.uidNumber);
    addChangeIfDefined('sn', userData.sn);

    // Perform the update
    if (changes.length > 0) {
        this.client.modify(dn, changes, (err) => {
            if (err) {
                console.error('Failed to update user:', err);
                callback(err);
            } else {
                console.log('User updated successfully');
                callback(null);
            }
        });
    } else {
        console.log('No valid attributes to update');
        callback(null, 'No changes made'); // Inform caller that no changes were made
    }
  }

  updateGroup(groupname, groupData, callback) {
    const oldGroupDN = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`;
    const newGroupDN = `cn=${groupData.groupName},ou=groups,dc=netsecurityass,dc=com`;
    const changes = [];

      // Helper function to add change only if value is defined and not null
      const addChangeIfDefined = (attrType, value) => {
        if (value !== undefined && value !== null) {
            changes.push(new ldap.Change({
                operation: 'replace',
                modification: new ldap.Attribute({
                    type: attrType,
                    values: [value]  // Ensure the value is encapsulated in an array
                })
            }));
        }
      };
  
      addChangeIfDefined('gidNumber', groupData.gidNumber);
    // Perform the update
    if (changes.length > 0) {
      this.client.modify(oldGroupDN, changes, (err) => {
          if (err) {
              console.error('Failed to update Group gidNumber:', err);
              callback(err);
          } else {
              console.log('Group gidNumber updated successfully');
              groupData.userList && this.addManyUserToGroup(groupData.userList, groupname)
              this.client.modifyDN(oldGroupDN, newGroupDN, (err) => {
                if (err) {
                    console.error('Failed to rename the group:', err);
                    callback(err);
                    return;
                }
                console.log('Group renamed successfully');
                callback(null);
            });
          }
      });
      } else {
          console.log('No valid attributes to update');
          callback(null, 'No changes made'); // Inform caller that no changes were made
      }
  }

  addManyUserToGroup (userList, groupName){
    console.log(userList)
    userList.forEach(user => {
      this.addUserToGroup(user, groupName, (err) => {
        if (err) {
            console.log('One or more errors occurred during the addition process');
        } else {
            console.log('All users added successfully');
        }
      })
    });
  }

  removeUserFromGroup(userCN, groupname, callback) {
    console.log(userCN, groupname)
    const dn = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`;
    const deluser = new ldap.Attribute({
      type: 'memberUid',
      values: userCN
    });
    const change = new ldap.Change({
      operation: 'delete',
      modification: deluser
    });
    
    this.client.modify(dn, change, (err) => {
      if (err) {
        console.error('Error deleting user from group:', err);
        callback(err);
      } else {
        console.log('User deleted from group successfully');
        callback(null);
      }
    });
  }

  addUserToGroup(username ,groupname, callback) {
    const dn = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`;
    const newUser = new ldap.Attribute({
      type: 'memberUid',
      values: `cn=${username}, ou=users, dc=netsecurityass, dc=com`
    });
    const change = new ldap.Change({
      operation: 'add',
      modification: newUser
    });
    
    this.client.modify(dn, change, (err) => {
      if (err) {
        console.error('Error adding user to group:', err);
        callback(err);
      } else {
        console.log('User added to group successfully');
        callback(null);
      }
    });
  }

  modifyDN(username, callback) {
    const dn = `cn=${username},ou=users,dc=netsecurityass,dc=com`;
    this.client.modifyDN(dn, 'cn=ba4r', (err) => {
      if (err) {
        console.error('Error modifying user DN:', err);
        callback(err);
      } else {
        console.log('User DN modified successfully');
        callback(null);
      }
    });
  }

  createGroup(groupname, gid, callback) {
    const dn = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    const entry = {
      cn: groupname,
      gidNumber: gid,
      objectClass: 'posixGroup',
    };
    this.client.add(dn, entry, (err) => {
      if (err) {
        console.error('Error creating group:', err);
        return callback(err);
      } else {
        console.log('Group created successfully');
        return callback(null);
      }
    });
  }

  deleteGroup(groupname, callback) {
    const groupDN = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`;
    this.client.del(groupDN, (err) => {
      if (err) {
          console.error('Failed to delete group:', err);
          callback(err);
      } else {
          console.log(`Group ${groupname} deleted successfully.`);
          callback(null);
      }
    });
  }
}

module.exports = LDAP;
