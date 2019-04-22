var hoursPerMonth = 730;
var tableResult;
var tableResultSelectedRow;
var byol_ec2arr;
var sles_ec2arr;
var win_ec2arr;
var winsqlstd_ec2arr;

function initDataTables() {
  tableResult = $('#tableResult').DataTable({
    paging: false,
    searching: false,
    ordering: false,
    columns: [
      { title: 'Application' },
      { title: 'Environment' },
      { title: 'Operating System' },
      { title: 'Database' },
      { title: 'SAPS Input' },
      { title: 'CPU Input' },
      { title: 'Memory Input' },
      { title: 'Root (GB)' },
      { title: 'USR (GB)' },
      { title: 'DB Data (GB)' },
      { title: 'DB Log (GB)' },
      { title: 'EC2 Instance Type' },
      { title: 'EC2 vCPU' },
      { title: 'EC2 RAM' },
      { title: 'EC2 SAPS' },
      { "defaultContent": "<button>Remove</button>" }
    ],
    dom: 'Bfrtip',
    buttons: [
        'csv'
    ]
  });
  $('#tableResult tbody').on('click', 'button', function () {
    //var data = tableResult.row($(this).parents('tr')).data();
    tableResult.row($(this).parents('tr')).remove().draw(true);
    updateCosting();
    //alert(data[0]);
  });

  $('#tableCostingInstance').DataTable({
    paging: false,
    searching: false,
    ordering: true,
    info: false,
    columns: [
      { title: 'Option' },
      { title: 'Type' },
      { title: 'App' },
      { title: 'Env' },
      { title: 'EC2 Instance Type' },
      { title: 'Instance Upfront' },
      { title: 'Instance Monthly' },
      { title: 'EBS (GP2)' },
      { title: 'EBS (ST1)' },
      { title: 'S3' },
      { title: 'Snapshot' }
    ],
    dom: 'Bfrtip',
    buttons: [
        'csv'
    ],
    "order": [[ 0, "asc" ]]
  });

  $('#tableEC2Select').DataTable({
    paging: false,
    searching: false,
    ordering: true,
    info: false,
    columns: [
      { title: 'EC2 Instance' },
      { title: 'vCPU' },
      { title: 'RAM' },
      { title: 'SAPS' }
    ],
    "order": [[ 3, "asc" ]]
  });
}

function addEC2SelectItems(saps) {
  var tableEC2Select = $('#tableEC2Select').DataTable();
  tableEC2Select.clear().draw(true);
  for (var item in saps) {
    tableEC2Select.row.add([
      saps[item].ec2,
      saps[item].vcpu,
      saps[item].ram,
      saps[item].saps
    ]).draw(true);
  }
}

function initModal() {
  var tableEC2Select = $('#tableEC2Select').DataTable();
  $('#tableEC2Select tbody').on('click', 'tr', function () {
    var rowData = tableEC2Select.row($(this)).data();
    tableResult.cell(tableResultSelectedRow, 11).data(rowData[0] + ' <a href="#">change</a>');
    tableResult.cell(tableResultSelectedRow, 12).data(rowData[1]);
    tableResult.cell(tableResultSelectedRow, 13).data(rowData[2]);
    tableResult.cell(tableResultSelectedRow, 14).data(rowData[3]).draw();
    updateCosting();
    $('#modalEC2Select').modal('hide');
  });
  $('#tableResult tbody').on('click', 'a', function () {
    tableResultSelectedRow = tableResult.row($(this).parents('tr')).index();
    $('#modalEC2Select').modal('show');
  });
}

function addServer(sizeState) {
  if (sizeState=="By SAPS") {
    ec2 = selectEC2BySAPS(
      $("#inputSAPS").val(),
      $("#inputOS").val(),
      $("#inputDatabase").val(),
      byol_ec2arr,
      sles_ec2arr,
      win_ec2arr,
      winsqlstd_ec2arr
    );
    tableResult.row.add([
        $("#inputAppName").val(),
        $("#inputEnvironment").val(),
        $("#inputOS").val(),
        $("#inputDatabase").val(),
        $("#inputSAPS").val().toLocaleString(),
        0,
        0,
        $("#inputRoot").val(),
        $("#inputUSR").val(),
        $("#inputDBData").val(),
        $("#inputDBLog").val(),
        ec2.ec2 + ' <a href="#">change</a>',
        ec2.vcpu,
        ec2.ram.toLocaleString(),
        ec2.saps.toLocaleString()
    ]).draw(true);
  } else {
    ec2 = selectEC2ByCPUAndRAM(
      $("#inputCPU").val(),
      $("#inputMemory").val(),
      $("#inputOS").val(),
      $("#inputDatabase").val(),
      byol_ec2arr,
      sles_ec2arr,
      win_ec2arr,
      winsqlstd_ec2arr
    );
    tableResult.row.add([
        $("#inputAppName").val(),
        $("#inputEnvironment").val(),
        $("#inputOS").val(),
        $("#inputDatabase").val(),
        0,
        $("#inputCPU").val(),
        $("#inputMemory").val(),
        $("#inputRoot").val(),
        $("#inputUSR").val(),
        $("#inputDBData").val(),
        $("#inputDBLog").val(),
        ec2.ec2 + ' <a href="#">change</a>',
        ec2.vcpu,
        ec2.ram.toLocaleString(),
        ec2.saps.toLocaleString()
    ]).draw(true);
  }
}

function updateCosting() {
  // init costing table
  var tableCostingInstance = $('#tableCostingInstance').DataTable();
  tableCostingInstance.clear().draw(true);

  // get result table data
  tableResult = $('#tableResult').DataTable();
  tableResultData = tableResult.data();

  var ebs_gp2_pricing = 0.12;
  var ebs_st1_pricing = 0.054;
  var s3_price = 0.025;
  var ebs_snapshot_pricing = 0.05;
  var ec2_instance_type;

  // loop through each result table data
  for (var i=0; i < tableResultData.length; i++) {
    item = tableResultData[i];
    ec2_instance_type = item[11].replace(' <a href="#">change</a>', '');

    // get ec2 instance type
    ec2data = findByEC2(
      ec2_instance_type,
      item[2], // OS
      item[3], // database,
      byol_ec2arr,
      sles_ec2arr,
      win_ec2arr,
      winsqlstd_ec2arr
    );

    ebsgp2_cost = formatCurrency((item[13]*3 + // swap 3 x RAM
          Number(item[7]) + Number(item[8]) + Number(item[9]) + Number(item[10]))*ebs_gp2_pricing, 'mo');
    ebsst1_cost = formatCurrency((Number(item[7]) + Number(item[9]) + Number(item[10]))*ebs_st1_pricing, 'mo');
    s3_cost = formatCurrency((Number(item[7]) + Number(item[9]) + Number(item[10]))*s3_price, 'mo');
    snapshot_cost = formatCurrency((Number(item[7]) + Number(item[8]))*ebs_snapshot_pricing, 'mo'); // root + usr

    // add row
    tableCostingInstance.row.add([
      1,
      "On-Demand",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(0),
      formatCurrency(ec2data.cost_od * hoursPerMonth, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
    tableCostingInstance.row.add([
      2,
      "Standard 1-Year Reserved Instance No Upfront",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(0),
      formatCurrency(ec2data.cost_1yrnu, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
    tableCostingInstance.row.add([
      3,
      "Standard 1-Year Reserved Instance Partial Upfront",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(ec2data.cost_1yrpu_ot),
      formatCurrency(ec2data.cost_1yrpu, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
    tableCostingInstance.row.add([
      4,
      "Standard 1-Year Reserved Instance Full Upfront",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(ec2data.cost_1yrfu),
      formatCurrency(0, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
    tableCostingInstance.row.add([
      5,
      "Standard 3-Year Reserved Instance No Upfront",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(0),
      formatCurrency(ec2data.cost_3yrnu, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
    tableCostingInstance.row.add([
      6,
      "Standard 3-Year Reserved Instance Partial Upfront",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(ec2data.cost_3yrpu_ot),
      formatCurrency(ec2data.cost_3yrpu, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
    tableCostingInstance.row.add([
      7,
      "Standard 3-Year Reserved Instance Full Upfront",
      item[0],
      item[1],
      ec2_instance_type,
      formatCurrency(ec2data.cost_3yrfu),
      formatCurrency(0, 'mo'),
      ebsgp2_cost,
      ebsst1_cost,
      s3_cost,
      snapshot_cost
    ]).draw(true);
  };
}