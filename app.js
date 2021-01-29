let selectedFile1;
let selectedFile2;
let resSchema = {};

let hostFilter = '';

document.querySelector('#name').addEventListener('change', (event) => {
    hostFilter = event.target.value;
});

// DATA USUARIOS TOTALES
document.getElementById('input1').addEventListener("change", (event) => {
    selectedFile1 = event.target.files[0];
    resSchema = {}
});

// DATA REUNIONES TOTALES
document.getElementById('input2').addEventListener("change", (event) => {
    selectedFile2 = event.target.files[0];
    resSchema = {}
});


document.getElementById('button').addEventListener("click", () => {
    resSchema = {}

   console.log(hostFilter)

    // USUARIOS TOTALES
    if(selectedFile1){
       
        readCSVData(selectedFile1).then(devices => {
            devices.map(d => {
                if (resSchema[d['Meeting ID']] == undefined) {
                    resSchema[d['Meeting ID']] = {
                        'id_reunion': d['Meeting ID'],
                        'name_reunion': '',
                        'name_host': '',
                        'email_host': '',
                        'total_users': 0,
                        'users': [{
                            'name': d['User Name'],
                            'device': d['Device Type'],
                        }]
                    }
                } else {
                    let userExists = false;
                    resSchema[d['Meeting ID']]['users'].map(u => {
                        if (u['name'] == d['User Name']) {
                            userExists = true;
                        }
                    })
                    if (!userExists) {
                        resSchema[d['Meeting ID']]['users'].push({
                            'name': d['User Name'],
                            'device': d['Device Type']
                        });
                    }
                }
            });
           // console.log(devices)
           // console.log(resSchema)

           let finalArrSchema = [];
           Object.keys(resSchema).map(r => {
              finalArrSchema.push(resSchema[r])
           })
       
       
           // REUNIONES TOTALES
           if(selectedFile2){
               readCSVData(selectedFile2).then(meetings => {
                   // console.log(meetings)
                   meetings.map(m => {
                      let meet_id = Number(m['Meeting ID'].replaceAll(' ',''))
                   
                      finalArrSchema.map((r, i) => {
                          if (r['id_reunion'] == meet_id) {

                           
                                finalArrSchema[i] = {
                                    'id_reunion': r['id_reunion'],
                                    'date_reunion': JSON.stringify(m['Start Time']).replace('T', ' | '),
                                    'name_reunion': m['Topic'],
                                    'name_host': m['Host'],
                                    'email_host': m['Email'],
                                    'total_users': r['users'].length,
                                    'users': r['users']
                                  }
                          
                          }
                      })
                   })


                   finalArrSchema.map(r => {
                       let arrOfUsers = []
                       r['users'].map(u => {
                            arrOfUsers.push(`${u['name']} (${u['device']})`)
                       })
                       r['users'] = arrOfUsers.join(' | ')
                   });

                   if(hostFilter != '') {
                    finalArrSchema = finalArrSchema.filter(r => r['email_host'] == hostFilter)
                   }
                  

                   let arrSchemaSorted = []

                   for(let i=0; i<finalArrSchema.length; i++) {
                       let c = finalArrSchema[i]['email_host']
                       arrSchemaSorted.push(finalArrSchema[i])
                       finalArrSchema.splice(0, 1)
                       i--
                       for(let x=0; x<finalArrSchema.length; x++) {
                           if(finalArrSchema[x]['email_host'] == c) {
                               arrSchemaSorted.push(finalArrSchema[x])
                               finalArrSchema.splice(finalArrSchema.indexOf(finalArrSchema[x]), 1)
                               x--
                           }
                       }
                   }
                   console.log(arrSchemaSorted)
                   exportToSpreadsheet(arrSchemaSorted, new Date())
               });
           }
        });
    }
});


// Helpers
function exportToSpreadsheet(data, fileName){
    const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const workSheet = XLSX.utils.json_to_sheet(data);
    // console.log(workSheet)

    const workBook = {
        Sheets: { data: workSheet, cols: [] },
        SheetNames: ["data"],
    };
    const excelBuffer = XLSX.write(workBook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: fileType });
    saveAs(fileData, fileName + fileExtension);
};



function readCSVData(file) {
    return new Promise((resolve, _) => {
        let fileReader = new FileReader();
        fileReader.readAsBinaryString(file);
        fileReader.onload = (event) => {
         let data = event.target.result;
         let workbook = XLSX.read(data,{type:"binary", cellDates: true});
         workbook.SheetNames.forEach(sheet => {
              let rowObject = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet], {dateNF:"YYYY-MM-DD"});
              resolve(rowObject)
         });
        }
    });
}
